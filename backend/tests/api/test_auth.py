from fastapi.testclient import TestClient
from unittest.mock import AsyncMock

from app.services import email_service
from app.core.config import settings
from app.core.config import Settings
from fastapi_users.jwt import decode_jwt, generate_jwt


def test_user_registration(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "user@example.com",
            "password": "supersecretpassword123",
            "is_active": True,
            "is_superuser": False,
            "is_verified": False,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "user@example.com"
    assert "id" in data


def test_user_login(client: TestClient) -> None:
    # 1. Register
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "loginuser@example.com",
            "password": "mypassword123",
        },
    )

    # 2. Login
    login_response = client.post(
        "/api/v1/auth/jwt/login",
        data={
            "username": "loginuser@example.com",
            "password": "mypassword123",
        },
    )
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"


def test_protected_route_access(client: TestClient) -> None:
    # Attempt without token
    unauthorized_response = client.get("/api/v1/users/me")
    assert unauthorized_response.status_code == 401

    # Register & Login
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "protected@example.com",
            "password": "mypassword123",
        },
    )

    login_response = client.post(
        "/api/v1/auth/jwt/login",
        data={
            "username": "protected@example.com",
            "password": "mypassword123",
        },
    )
    token = login_response.json()["access_token"]

    # Access protected route with Bearer token
    authorized_response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert authorized_response.status_code == 200
    assert authorized_response.json()["email"] == "protected@example.com"


def test_get_users_me(client: TestClient) -> None:
    # Register & Login
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "me@example.com",
            "password": "mypassword123",
        },
    )

    login_response = client.post(
        "/api/v1/auth/jwt/login",
        data={
            "username": "me@example.com",
            "password": "mypassword123",
        },
    )
    token = login_response.json()["access_token"]

    # Access /users/me
    me_response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["email"] == "me@example.com"
    assert me_data["is_active"] is True


def test_forgot_password_is_generic_and_sends_email(client: TestClient, monkeypatch) -> None:
    send = AsyncMock(return_value=True)
    monkeypatch.setattr(email_service, "send_password_reset_email", send)
    client.post("/api/v1/auth/register", json={"email": "reset@example.com", "password": "oldpassword123"})

    existing = client.post("/api/v1/auth/reset-password/forgot-password", json={"email": "reset@example.com"})
    missing = client.post("/api/v1/auth/reset-password/forgot-password", json={"email": "missing@example.com"})

    assert existing.status_code == 202
    assert missing.status_code == 202
    assert existing.content == missing.content
    send.assert_awaited_once()
    email, reset_url, _ = send.await_args.args
    assert email == "reset@example.com"
    assert "/reset-password?token=" in reset_url


def test_reset_password_valid_and_invalid_token(client: TestClient, monkeypatch) -> None:
    captured = {}

    async def capture(email, reset_url, settings):
        captured["token"] = reset_url.split("token=", 1)[1]
        return True

    monkeypatch.setattr(email_service, "send_password_reset_email", capture)
    client.post("/api/v1/auth/register", json={"email": "reset-valid@example.com", "password": "oldpassword123"})
    client.post("/api/v1/auth/reset-password/forgot-password", json={"email": "reset-valid@example.com"})

    weak = client.post("/api/v1/auth/reset-password/reset-password", json={"token": captured["token"], "password": "short"})
    assert weak.status_code == 400
    invalid = client.post("/api/v1/auth/reset-password/reset-password", json={"token": "expired-or-invalid", "password": "newpassword123"})
    assert invalid.status_code == 400
    token_data = decode_jwt(captured["token"], settings.secret_key, ["fastapi-users:reset"])
    expired_token = generate_jwt(token_data, settings.secret_key, -1)
    expired = client.post("/api/v1/auth/reset-password/reset-password", json={"token": expired_token, "password": "newpassword123"})
    assert expired.status_code == 400
    valid = client.post("/api/v1/auth/reset-password/reset-password", json={"token": captured["token"], "password": "newpassword123"})
    assert valid.status_code == 200
    login = client.post("/api/v1/auth/jwt/login", data={"username": "reset-valid@example.com", "password": "newpassword123"})
    assert login.status_code == 200


def test_smtp_password_reset_message(monkeypatch) -> None:
    events = []

    class FakeSMTP:
        def __init__(self, host, port, timeout):
            events.append(("connect", host, port, timeout))
        def __enter__(self):
            return self
        def __exit__(self, *args):
            return None
        def starttls(self):
            events.append(("tls",))
        def login(self, username, password):
            events.append(("login", username, password))
        def send_message(self, message):
            events.append(("send", message["To"], message["Subject"]))

    class FakeSMTPSSL(FakeSMTP):
        def __init__(self, host, port, timeout):
            events.append(("connect_ssl", host, port, timeout))

    monkeypatch.setattr(email_service.smtplib, "SMTP", FakeSMTP)
    monkeypatch.setattr(email_service.smtplib, "SMTP_SSL", FakeSMTPSSL)

    # 1. Test Port 587 STARTTLS
    smtp_settings = Settings(
        smtp_host="smtp.example.com", smtp_port=587,
        smtp_username="mailer", smtp_password="secret",
        smtp_sender="no-reply@example.com", smtp_use_tls=True,
    )
    import asyncio
    sent = asyncio.run(email_service.send_password_reset_email(
        "member@example.com", "http://localhost/reset-password?token=safe", smtp_settings
    ))
    assert sent is True
    assert ("tls",) in events
    assert ("send", "member@example.com", "Đặt lại mật khẩu BIMAutomation") in events

    # 2. Test Port 465 SSL (Hostinger)
    hostinger_settings = Settings(
        smtp_host="smtp.hostinger.com", smtp_port=465,
        smtp_username="support@bimautomation.solutions", smtp_password="secretpassword",
        smtp_from_name="BIM Automation", smtp_use_ssl=True, smtp_use_tls=False
    )
    sent_order = asyncio.run(email_service.send_order_success_email(
        "customer@example.com", "BA260823-1234", "Gói Cá Nhân Năm", 2500000, "BA-PRO-9999-ABCD", hostinger_settings
    ))
    assert sent_order is True
    assert ("connect_ssl", "smtp.hostinger.com", 465, 15) in events
    assert ("send", "customer@example.com", "Xác nhận thanh toán thành công đơn hàng BA260823-1234 - BIMAutomation") in events
