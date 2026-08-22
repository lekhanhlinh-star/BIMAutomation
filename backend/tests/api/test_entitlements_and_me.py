from datetime import datetime, timedelta, timezone
import uuid
import pytest
from fastapi.testclient import TestClient

from app.models.device import Device
from app.models.license import License, LicenseStatus
from app.models.user import User, UserRole
from app.services.token_service import create_access_token
from tests.conftest import TestSessionLocal


@pytest.mark.asyncio
async def test_entitlements_resolution(client: TestClient) -> None:
    async with TestSessionLocal() as session:
        user = User(
            email="entitle_user@example.com",
            hashed_password="hash",
            role=UserRole.USER,
            is_active=True,
        )
        session.add(user)
        await session.flush()

        # License with Pro plan -> gets all 13 features
        lic = License(
            license_key="BP-PRO-KEY-9999",
            user_id=user.id,
            plan_name="professional",
            status=LicenseStatus.ACTIVE,
            max_devices=2,
            starts_at=datetime.now(timezone.utc),
            expires_at=datetime.now(timezone.utc) + timedelta(days=100),
        )
        session.add(lic)
        await session.commit()
        user_id = user.id

    token = create_access_token(user_id=user_id, email="entitle_user@example.com")

    resp = client.get(
        "/api/v1/entitlements/revitapp",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["allowed"] is True
    assert data["product"] == "revitapp"
    assert data["plan"] == "professional"
    assert "beam-rebar" in data["features"]
    assert "mcp-write" in data["features"]
    assert len(data["features"]) == 13


@pytest.mark.asyncio
async def test_me_endpoints_and_device_revoke(client: TestClient) -> None:
    async with TestSessionLocal() as session:
        user = User(
            email="me_test@example.com",
            name="Tran Van B",
            hashed_password="hash",
            role=UserRole.USER,
            is_active=True,
        )
        session.add(user)
        await session.flush()

        lic = License(
            license_key="BP-ME-KEY-1111",
            user_id=user.id,
            plan_name="standard",
            status=LicenseStatus.ACTIVE,
            max_devices=2,
            starts_at=datetime.now(timezone.utc),
            expires_at=datetime.now(timezone.utc) + timedelta(days=100),
        )
        session.add(lic)
        await session.flush()

        dev = Device(
            license_id=lic.id,
            installation_id=str(uuid.uuid4()),
            fingerprint_hash="fp_me_dev_123",
            display_name="MY-WORKSTATION",
        )
        session.add(dev)
        await session.commit()
        await session.refresh(dev)
        user_id = user.id
        dev_id = dev.id

    token = create_access_token(user_id=user_id, email="me_test@example.com")

    # 1. GET /me
    me_resp = client.get("/api/v1/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "me_test@example.com"
    assert me_resp.json()["name"] == "Tran Van B"

    # 2. GET /me/licenses
    lic_resp = client.get("/api/v1/me/licenses", headers={"Authorization": f"Bearer {token}"})
    assert lic_resp.status_code == 200
    assert len(lic_resp.json()) == 1
    assert lic_resp.json()[0]["licenseKey"] == "BP-ME-KEY-1111"

    # 3. GET /me/devices
    dev_resp = client.get("/api/v1/me/devices", headers={"Authorization": f"Bearer {token}"})
    assert dev_resp.status_code == 200
    assert len(dev_resp.json()) == 1
    assert dev_resp.json()[0]["displayName"] == "MY-WORKSTATION"

    # 4. DELETE /me/devices/{deviceId}
    del_resp = client.delete(f"/api/v1/me/devices/{dev_id}", headers={"Authorization": f"Bearer {token}"})
    assert del_resp.status_code == 200

    # 5. Verify device list is now empty
    dev_resp2 = client.get("/api/v1/me/devices", headers={"Authorization": f"Bearer {token}"})
    assert len(dev_resp2.json()) == 0
