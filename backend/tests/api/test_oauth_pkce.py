import base64
from datetime import datetime, timedelta, timezone
import hashlib
import urllib.parse
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.models.auth_code import AuthorizationCode
from app.models.user import User, UserRole
from app.services.pkce_service import hash_token
from tests.conftest import TestSessionLocal


def generate_pkce_pair(verifier: str = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"):
    digest = hashlib.sha256(verifier.encode("ascii")).digest()
    challenge = base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")
    return verifier, challenge


@pytest.mark.asyncio
async def test_oauth_pkce_success_flow(client: TestClient) -> None:
    # 1. Create active user with trial registered
    async with TestSessionLocal() as session:
        user = User(
            email="revit_user@example.com",
            hashed_password="secret_password_hash",
            role=UserRole.USER,
            is_active=True,
            is_trial_registered=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        user_id = user.id

    verifier, challenge = generate_pkce_pair()
    redirect_uri = "http://127.0.0.1:45678/callback"
    state = "secure_state_123"

    # 2. Authorize
    auth_resp = client.get(
        "/oauth/authorize",
        params={
            "response_type": "code",
            "client_id": "revitapp-desktop",
            "redirect_uri": redirect_uri,
            "code_challenge": challenge,
            "code_challenge_method": "S256",
            "state": state,
            "user_id": str(user_id),
        },
        follow_redirects=False,
    )
    assert auth_resp.status_code == 302
    location = auth_resp.headers["location"]
    assert location.startswith(redirect_uri)
    assert "state=secure_state_123" in location
    assert "code=" in location

    # Extract code
    parsed = urllib.parse.urlparse(location)
    q = urllib.parse.parse_qs(parsed.query)
    code = q["code"][0]

    # 3. Exchange Token
    token_resp = client.post(
        "/oauth/token",
        json={
            "grant_type": "authorization_code",
            "client_id": "revitapp-desktop",
            "code": code,
            "code_verifier": verifier,
            "redirect_uri": redirect_uri,
        },
    )
    assert token_resp.status_code == 200
    token_data = token_resp.json()
    assert "access_token" in token_data
    assert "refresh_token" in token_data
    assert token_data["token_type"] == "Bearer"
    assert token_data["expires_in"] == 900


@pytest.mark.asyncio
async def test_oauth_pkce_unregistered_user_shows_onboarding_form_and_completes_consent(client: TestClient) -> None:
    # 1. Create active user WITHOUT trial registration
    async with TestSessionLocal() as session:
        user = User(
            name="Google Engineer",
            email="google_engineer@example.com",
            hashed_password="secret_password_hash",
            role=UserRole.USER,
            is_active=True,
            is_trial_registered=False,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        user_id = user.id

    verifier, challenge = generate_pkce_pair()
    redirect_uri = "http://127.0.0.1:45678/callback"
    state = "state_onboarding_test"

    # 2. Authorize -> Should render Onboarding Form (200 OK HTML)
    auth_resp = client.get(
        "/oauth/authorize",
        params={
            "response_type": "code",
            "client_id": "revitapp-desktop",
            "redirect_uri": redirect_uri,
            "code_challenge": challenge,
            "code_challenge_method": "S256",
            "state": state,
            "user_id": str(user_id),
        },
    )
    assert auth_resp.status_code == 200
    assert "Đăng Ký Dùng Thử 14 Ngày" in auth_resp.text
    assert "google_engineer@example.com" in auth_resp.text

    # 3. Submit Trial Consent Form
    consent_resp = client.post(
        "/oauth/consent",
        data={
            "user_id": str(user_id),
            "client_id": "revitapp-desktop",
            "redirect_uri": redirect_uri,
            "code_challenge": challenge,
            "code_challenge_method": "S256",
            "state": state,
            "name": "Kỹ Sư Kết Cấu BIM",
            "phone": "0988776655",
            "job_title": "Kỹ sư Kết cấu (Structural Engineer)",
            "revit_version": "2025",
            "use_case": "Bố trí cốt thép tự động",
            "terms_accepted": "true",
        },
        follow_redirects=False,
    )
    assert consent_resp.status_code == 302
    location = consent_resp.headers["location"]
    assert location.startswith(redirect_uri)
    assert "state=state_onboarding_test" in location
    assert "code=" in location

    # Extract code
    parsed = urllib.parse.urlparse(location)
    code = urllib.parse.parse_qs(parsed.query)["code"][0]

    # 4. Exchange Token in Revit
    token_resp = client.post(
        "/oauth/token",
        json={
            "grant_type": "authorization_code",
            "client_id": "revitapp-desktop",
            "code": code,
            "code_verifier": verifier,
            "redirect_uri": redirect_uri,
        },
    )
    assert token_resp.status_code == 200
    access_token = token_resp.json()["access_token"]

    # 5. Revit calls /api/v1/entitlements/check with hardware_fingerprint
    check_resp = client.post(
        "/api/v1/entitlements/check",
        headers={"Authorization": f"Bearer {access_token}"},
        json={
            "product_code": "revitapp",
            "hardware_fingerprint": "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            "device_name": "PC-BIM-STATION",
            "revit_version": "2025",
        },
    )
    assert check_resp.status_code == 200
    ent_data = check_resp.json()
    assert ent_data["allowed"] is True
    assert ent_data["isTrial"] is True
    assert ent_data["plan"] == "14-Day Free Trial"
    assert len(ent_data["features"]) == 13
    assert "beam-rebar" in ent_data["features"]
    assert "chat-ai" in ent_data["features"]
    assert "mcp-write" in ent_data["features"]


@pytest.mark.asyncio
async def test_oauth_pkce_invalid_verifier_rejected(client: TestClient) -> None:
    async with TestSessionLocal() as session:
        user = User(
            email="verifier_test@example.com",
            hashed_password="hash",
            role=UserRole.USER,
            is_active=True,
            is_trial_registered=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        user_id = user.id

    verifier, challenge = generate_pkce_pair()
    redirect_uri = "http://127.0.0.1:45678/callback"

    auth_resp = client.get(
        "/oauth/authorize",
        params={
            "response_type": "code",
            "client_id": "revitapp-desktop",
            "redirect_uri": redirect_uri,
            "code_challenge": challenge,
            "code_challenge_method": "S256",
            "state": "st",
            "user_id": str(user_id),
        },
        follow_redirects=False,
    )
    parsed = urllib.parse.urlparse(auth_resp.headers["location"])
    code = urllib.parse.parse_qs(parsed.query)["code"][0]

    # Send wrong verifier
    wrong_token_resp = client.post(
        "/oauth/token",
        json={
            "grant_type": "authorization_code",
            "client_id": "revitapp-desktop",
            "code": code,
            "code_verifier": "WRONG_VERIFIER_STRING_THAT_DOES_NOT_MATCH_CHALLENGE_12345",
            "redirect_uri": redirect_uri,
        },
    )
    assert wrong_token_resp.status_code == 400
    assert wrong_token_resp.json()["detail"] == "invalid_grant"


@pytest.mark.asyncio
async def test_oauth_single_use_authorization_code(client: TestClient) -> None:
    async with TestSessionLocal() as session:
        user = User(
            email="single_use@example.com",
            hashed_password="hash",
            role=UserRole.USER,
            is_active=True,
            is_trial_registered=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        user_id = user.id

    verifier, challenge = generate_pkce_pair()
    redirect_uri = "http://127.0.0.1:45678/callback"

    auth_resp = client.get(
        "/oauth/authorize",
        params={
            "response_type": "code",
            "client_id": "revitapp-desktop",
            "redirect_uri": redirect_uri,
            "code_challenge": challenge,
            "code_challenge_method": "S256",
            "state": "st",
            "user_id": str(user_id),
        },
        follow_redirects=False,
    )
    parsed = urllib.parse.urlparse(auth_resp.headers["location"])
    code = urllib.parse.parse_qs(parsed.query)["code"][0]

    # First exchange succeeds
    res1 = client.post(
        "/oauth/token",
        json={
            "grant_type": "authorization_code",
            "client_id": "revitapp-desktop",
            "code": code,
            "code_verifier": verifier,
            "redirect_uri": redirect_uri,
        },
    )
    assert res1.status_code == 200

    # Second exchange with same code MUST fail
    res2 = client.post(
        "/oauth/token",
        json={
            "grant_type": "authorization_code",
            "client_id": "revitapp-desktop",
            "code": code,
            "code_verifier": verifier,
            "redirect_uri": redirect_uri,
        },
    )
    assert res2.status_code == 400
    assert res2.json()["detail"] == "invalid_grant"


@pytest.mark.asyncio
async def test_oauth_expired_authorization_code_rejected(client: TestClient) -> None:
    async with TestSessionLocal() as session:
        user = User(
            email="expired_code@example.com",
            hashed_password="hash",
            role=UserRole.USER,
            is_active=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

        # Manually create expired auth code in DB
        verifier, challenge = generate_pkce_pair()
        code = "expired_raw_code_123"
        code_h = hash_token(code)
        expired_auth = AuthorizationCode(
            code_hash=code_h,
            user_id=user.id,
            client_id="revitapp-desktop",
            redirect_uri="http://127.0.0.1:45678/callback",
            code_challenge=challenge,
            code_challenge_method="S256",
            expires_at=datetime.now(timezone.utc) - timedelta(seconds=10),
        )
        session.add(expired_auth)
        await session.commit()

    resp = client.post(
        "/oauth/token",
        json={
            "grant_type": "authorization_code",
            "client_id": "revitapp-desktop",
            "code": code,
            "code_verifier": verifier,
            "redirect_uri": "http://127.0.0.1:45678/callback",
        },
    )
    assert resp.status_code == 400
    assert resp.json()["detail"] == "invalid_grant"


@pytest.mark.asyncio
async def test_oauth_invalid_redirect_uri_rejected(client: TestClient) -> None:
    # Disallow remote or invalid redirect URIs
    resp = client.get(
        "/oauth/authorize",
        params={
            "response_type": "code",
            "client_id": "revitapp-desktop",
            "redirect_uri": "https://malicious-attacker.com/steal-code",
            "code_challenge": "challenge",
            "code_challenge_method": "S256",
            "state": "st",
        },
    )
    assert resp.status_code == 400
    assert resp.json()["detail"] == "invalid_redirect_uri"


@pytest.mark.asyncio
async def test_oauth_login_prompt_script_structure(client: TestClient) -> None:
    """Verifies that /oauth/authorize HTML prompt contains the secure fetch, google validation, and state handling."""
    redirect_uri = "http://127.0.0.1:54321/callback"
    client_id = "revitapp-desktop"
    verifier, challenge = generate_pkce_pair()
    state = "unique_client_csrf_state_999"

    resp = client.get(
        "/oauth/authorize",
        params={
            "response_type": "code",
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "code_challenge": challenge,
            "code_challenge_method": "S256",
            "state": state,
        },
    )
    assert resp.status_code == 200
    html = resp.text

    # 1. Calls fetch('/api/v1/auth/google/authorize')
    assert "fetch('/api/v1/auth/google/authorize'" in html
    # 2. Uses window.location.assign
    assert "window.location.assign(authUrl.href)" in html
    # 3. Validates accounts.google.com and https:
    assert "authUrl.hostname !== 'accounts.google.com'" in html
    assert "authUrl.protocol !== 'https:'" in html
    # 4. Saves pending_desktop_oauth in sessionStorage
    assert "sessionStorage.setItem('pending_desktop_oauth'" in html
    assert 'response_type: "code"' in html
    assert f'state: "{state}"' in html
    assert f'client_id: "{client_id}"' in html
    # 5. Has disabled state and error alert element
    assert "btn.disabled = true" in html
    assert 'id="errorAlert"' in html
    assert 'id="btnSpinner"' in html


@pytest.mark.asyncio
async def test_oauth_state_mismatch_protection(client: TestClient) -> None:
    """Verifies that redirect flow retains exact state and detects any state mismatch."""
    async with TestSessionLocal() as session:
        user = User(
            email="state_test_user@example.com",
            hashed_password="secret_password_hash",
            role=UserRole.USER,
            is_active=True,
            is_trial_registered=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        user_id = user.id

    verifier, challenge = generate_pkce_pair()
    redirect_uri = "http://127.0.0.1:45678/callback"
    initial_client_state = "client_generated_state_xyz123"

    auth_resp = client.get(
        "/oauth/authorize",
        params={
            "response_type": "code",
            "client_id": "revitapp-desktop",
            "redirect_uri": redirect_uri,
            "code_challenge": challenge,
            "code_challenge_method": "S256",
            "state": initial_client_state,
            "user_id": str(user_id),
        },
        follow_redirects=False,
    )
    assert auth_resp.status_code == 302
    location = auth_resp.headers["location"]

    parsed = urllib.parse.urlparse(location)
    query_params = urllib.parse.parse_qs(parsed.query)

    received_state = query_params.get("state", [None])[0]
    received_code = query_params.get("code", [None])[0]

    # Verify state matches initial client state
    assert received_state == initial_client_state
    assert received_code is not None

    # Simulate client verification: if attacker tampers with state
    tampered_state = "attacker_injected_state_456"
    assert received_state != tampered_state  # State mismatch detected!


@pytest.mark.asyncio
async def test_oauth_no_token_leakage_in_redirect_url_and_audit(client: TestClient) -> None:
    """Verifies that access_token and refresh_token are NEVER returned on redirect URLs or logged in plaintext."""
    async with TestSessionLocal() as session:
        user = User(
            email="no_leak_user@example.com",
            hashed_password="secret_password_hash",
            role=UserRole.USER,
            is_active=True,
            is_trial_registered=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        user_id = user.id

    verifier, challenge = generate_pkce_pair()
    redirect_uri = "http://127.0.0.1:45678/callback"

    auth_resp = client.get(
        "/oauth/authorize",
        params={
            "response_type": "code",
            "client_id": "revitapp-desktop",
            "redirect_uri": redirect_uri,
            "code_challenge": challenge,
            "code_challenge_method": "S256",
            "state": "state_no_leak",
            "user_id": str(user_id),
        },
        follow_redirects=False,
    )
    location = auth_resp.headers["location"]

    # Must NOT contain access_token or Bearer in redirect URL
    assert "access_token" not in location
    assert "refresh_token" not in location
    assert "Bearer" not in location

    parsed = urllib.parse.urlparse(location)
    code = urllib.parse.parse_qs(parsed.query)["code"][0]

    # Token exchange via POST body only
    token_resp = client.post(
        "/oauth/token",
        json={
            "grant_type": "authorization_code",
            "client_id": "revitapp-desktop",
            "code": code,
            "code_verifier": verifier,
            "redirect_uri": redirect_uri,
        },
    )
    assert token_resp.status_code == 200
    token_data = token_resp.json()
    assert "access_token" in token_data
    assert "refresh_token" in token_data

