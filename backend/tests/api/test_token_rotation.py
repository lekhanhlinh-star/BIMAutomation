import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.models.refresh_session import RefreshSession
from app.models.user import User, UserRole
from app.services.token_service import create_refresh_session
from tests.conftest import TestSessionLocal


@pytest.mark.asyncio
async def test_refresh_token_rotation_success(client: TestClient) -> None:
    async with TestSessionLocal() as session:
        user = User(
            email="rotate_test@example.com",
            hashed_password="hash",
            role=UserRole.USER,
            is_active=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

        raw_refresh_token, sess_rec = await create_refresh_session(
            session=session,
            user_id=user.id,
        )

    # 1. Rotate token
    resp = client.post(
        "/oauth/token",
        json={
            "grant_type": "refresh_token",
            "client_id": "revitapp-desktop",
            "refresh_token": raw_refresh_token,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    new_access_token = data["access_token"]
    new_refresh_token = data["refresh_token"]
    assert new_refresh_token != raw_refresh_token

    # 2. Second rotation with the NEW refresh token succeeds
    resp2 = client.post(
        "/oauth/token",
        json={
            "grant_type": "refresh_token",
            "client_id": "revitapp-desktop",
            "refresh_token": new_refresh_token,
        },
    )
    assert resp2.status_code == 200
    assert resp2.json()["refresh_token"] != new_refresh_token


@pytest.mark.asyncio
async def test_refresh_token_reuse_detection_revokes_family(client: TestClient) -> None:
    async with TestSessionLocal() as session:
        user = User(
            email="reuse_test@example.com",
            hashed_password="hash",
            role=UserRole.USER,
            is_active=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

        token_r1, sess_rec = await create_refresh_session(
            session=session,
            user_id=user.id,
        )

    # Legitimate client rotates R1 -> gets R2
    resp1 = client.post(
        "/oauth/token",
        json={
            "grant_type": "refresh_token",
            "client_id": "revitapp-desktop",
            "refresh_token": token_r1,
        },
    )
    assert resp1.status_code == 200
    token_r2 = resp1.json()["refresh_token"]

    # Attacker tries to reuse old token R1!
    resp_reuse = client.post(
        "/oauth/token",
        json={
            "grant_type": "refresh_token",
            "client_id": "revitapp-desktop",
            "refresh_token": token_r1,
        },
    )
    assert resp_reuse.status_code == 400
    assert resp_reuse.json()["detail"] == "invalid_grant"

    # Now legitimate client's R2 MUST also be revoked due to family revocation!
    resp_r2 = client.post(
        "/oauth/token",
        json={
            "grant_type": "refresh_token",
            "client_id": "revitapp-desktop",
            "refresh_token": token_r2,
        },
    )
    assert resp_r2.status_code == 400
    assert resp_r2.json()["detail"] == "invalid_grant"
