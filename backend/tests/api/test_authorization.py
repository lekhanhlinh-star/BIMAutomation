from fastapi.testclient import TestClient
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from tests.conftest import TestSessionLocal


def test_user_registration_default_role(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "customer@example.com",
            "password": "customerpassword123",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["role"] == "USER"


def test_normal_user_cannot_access_admin_dashboard(client: TestClient) -> None:
    # 1. Register customer
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "customer_forbidden@example.com",
            "password": "mypassword123",
        },
    )

    # 2. Login
    login_response = client.post(
        "/api/v1/auth/jwt/login",
        data={
            "username": "customer_forbidden@example.com",
            "password": "mypassword123",
        },
    )
    token = login_response.json()["access_token"]

    # 3. Access admin dashboard -> Expect 403 Forbidden
    response = client.get(
        "/api/v1/admin/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Forbidden: Admin privileges required"


@pytest.mark.asyncio
async def test_admin_user_can_access_admin_dashboard(client: TestClient) -> None:
    # 1. Register user
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "admin@example.com",
            "password": "adminpassword123",
        },
    )

    # 2. Promote user to ADMIN in DB
    async with TestSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.email == "admin@example.com")
        )
        user = result.unique().scalar_one()
        user.role = UserRole.ADMIN
        await session.commit()

    # 3. Login
    login_response = client.post(
        "/api/v1/auth/jwt/login",
        data={
            "username": "admin@example.com",
            "password": "adminpassword123",
        },
    )
    token = login_response.json()["access_token"]

    # 4. Access admin dashboard -> Expect 200 OK
    response = client.get(
        "/api/v1/admin/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["role"] == "ADMIN"
    assert "admin@example.com" in response.json()["message"]
