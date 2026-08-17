from fastapi.testclient import TestClient
import pytest
from sqlalchemy import select

from app.models.user import User, UserRole
from tests.conftest import TestSessionLocal


@pytest.mark.asyncio
async def test_submit_feedback_public(client: TestClient) -> None:
    payload = {
        "name": "Nguyen Van A",
        "email": "nguyenvana@example.com",
        "type": "FEATURE",
        "title": "Support Revit 2026",
        "content": "Please add support for Revit 2026 auto-quantities.",
    }
    res = client.post("/api/v1/feedback", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Nguyen Van A"
    assert data["type"] == "FEATURE"
    assert data["status"] == "NEW"


@pytest.mark.asyncio
async def test_get_public_info(client: TestClient) -> None:
    res = client.get("/api/v1/public/info")
    assert res.status_code == 200
    data = res.json()
    assert "app_name" in data
    assert data["supported_revit_versions"] == [2021, 2022, 2023, 2024, 2025, 2026]


@pytest.mark.asyncio
async def test_admin_get_feedbacks(client: TestClient) -> None:
    # 1. Submit Feedback
    client.post(
        "/api/v1/feedback",
        json={
            "name": "Bim Manager",
            "email": "bimmanager@example.com",
            "type": "BUG",
            "title": "Crash on sync",
            "content": "Revit crashes when syncing model.",
        },
    )

    # 2. Register & Elevate Admin User
    client.post(
        "/api/v1/auth/register",
        json={"email": "feedback_admin@example.com", "password": "AdminPassword123!"},
    )
    async with TestSessionLocal() as session:
        res = await session.execute(
            select(User).where(User.email == "feedback_admin@example.com")
        )
        admin_user = res.unique().scalar_one()
        admin_user.role = UserRole.ADMIN
        await session.commit()

    login_res = client.post(
        "/api/v1/auth/jwt/login",
        data={
            "username": "feedback_admin@example.com",
            "password": "AdminPassword123!",
        },
    )
    token = login_res.json()["access_token"]

    # 3. GET /api/v1/admin/feedbacks
    admin_res = client.get(
        "/api/v1/admin/feedbacks",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert admin_res.status_code == 200
    feedbacks = admin_res.json()
    assert len(feedbacks) >= 1
    assert feedbacks[0]["title"] == "Crash on sync"
