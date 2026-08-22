from datetime import datetime, timedelta, timezone
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.models.device_trial import DeviceTrial, DeviceTrialStatus
from app.models.license import License, LicenseStatus
from app.models.product import Product
from app.models.user import User, UserRole
from app.services.token_service import create_access_token
from tests.conftest import TestSessionLocal


@pytest.mark.asyncio
async def test_trial_14_days_and_anti_abuse_across_accounts(client: TestClient) -> None:
    fp_hash = "hardware_fp_sha256_mock_1234567890abcdef"
    inst_id_1 = str(uuid.uuid4())

    async with TestSessionLocal() as session:
        # Create User A
        user_a = User(
            email="user_a@example.com",
            hashed_password="hash",
            role=UserRole.USER,
            is_active=True,
        )
        # Create User B
        user_b = User(
            email="user_b@example.com",
            hashed_password="hash",
            role=UserRole.USER,
            is_active=True,
        )
        session.add_all([user_a, user_b])
        await session.commit()
        await session.refresh(user_a)
        await session.refresh(user_b)
        user_a_id = user_a.id
        user_b_id = user_b.id

    token_a = create_access_token(user_id=user_a_id, email="user_a@example.com")
    token_b = create_access_token(user_id=user_b_id, email="user_b@example.com")

    # 1. User A activates on Machine for the first time -> Trial granted 14 days
    res1 = client.post(
        "/api/v1/devices/activate",
        headers={"Authorization": f"Bearer {token_a}"},
        json={
            "productCode": "revitapp",
            "installationId": inst_id_1,
            "machineFingerprint": fp_hash,
            "displayName": "OFFICE-PC-01",
            "platform": "windows",
            "revitVersion": "2025",
            "appVersion": "1.0.0",
        },
    )
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["success"] is True
    assert data1["isTrial"] is True
    assert "14 ngày còn lại" in data1["message"]

    # 2. Simulate 14 days passing -> Trial expires on server
    async with TestSessionLocal() as session:
        res_trial = await session.execute(
            select(DeviceTrial).where(DeviceTrial.fingerprint_hash == fp_hash)
        )
        trial = res_trial.scalar_one()
        trial.trial_expires_at = datetime.now(timezone.utc) - timedelta(days=1)
        trial.status = DeviceTrialStatus.EXPIRED
        await session.commit()

    # 3. User A tries again -> Blocked because trial expired on this machine
    res_a_expired = client.post(
        "/api/v1/devices/activate",
        headers={"Authorization": f"Bearer {token_a}"},
        json={
            "productCode": "revitapp",
            "installationId": inst_id_1,
            "machineFingerprint": fp_hash,
            "displayName": "OFFICE-PC-01",
            "platform": "windows",
            "revitVersion": "2025",
            "appVersion": "1.0.0",
        },
    )
    assert res_a_expired.status_code == 403
    assert res_a_expired.json()["detail"] == "trial_expired_on_device"

    # 4. User B (Brand new account) tries on the same machine -> STILL BLOCKED!
    res_b_blocked = client.post(
        "/api/v1/devices/activate",
        headers={"Authorization": f"Bearer {token_b}"},
        json={
            "productCode": "revitapp",
            "installationId": str(uuid.uuid4()),
            "machineFingerprint": fp_hash,
            "displayName": "OFFICE-PC-01",
            "platform": "windows",
            "revitVersion": "2025",
            "appVersion": "1.0.0",
        },
    )
    assert res_b_blocked.status_code == 403
    assert res_b_blocked.json()["detail"] == "trial_expired_on_device"


@pytest.mark.asyncio
async def test_paid_license_overrides_trial_block(client: TestClient) -> None:
    fp_hash = "hardware_fp_paid_override"
    inst_id = str(uuid.uuid4())

    async with TestSessionLocal() as session:
        # Create User with an active paid license
        user = User(
            email="buyer_pro@example.com",
            hashed_password="hash",
            role=UserRole.USER,
            is_active=True,
        )
        session.add(user)
        await session.flush()

        # Seed expired trial for this machine
        expired_trial = DeviceTrial(
            fingerprint_hash=fp_hash,
            display_name="OFFICE-PC",
            first_trial_at=datetime.now(timezone.utc) - timedelta(days=30),
            trial_expires_at=datetime.now(timezone.utc) - timedelta(days=16),
            status=DeviceTrialStatus.EXPIRED,
        )
        session.add(expired_trial)

        # Grant Paid License
        paid_license = License(
            license_key="BP-PRO-PAID-KEY-1234",
            user_id=user.id,
            plan_name="professional",
            status=LicenseStatus.ACTIVE,
            max_devices=2,
            starts_at=datetime.now(timezone.utc),
            expires_at=datetime.now(timezone.utc) + timedelta(days=365),
        )
        session.add(paid_license)
        await session.commit()
        user_id = user.id

    token = create_access_token(user_id=user_id, email="buyer_pro@example.com")

    # Activation on machine with expired trial succeeds because user has Paid License!
    resp = client.post(
        "/api/v1/devices/activate",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "productCode": "revitapp",
            "installationId": inst_id,
            "machineFingerprint": fp_hash,
            "displayName": "OFFICE-PC",
            "platform": "windows",
            "revitVersion": "2025",
            "appVersion": "1.0.0",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["isTrial"] is False
    assert data["plan"] == "professional"

    # Idempotent reactivation on same installationId succeeds without consuming extra slot
    resp_idem = client.post(
        "/api/v1/devices/activate",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "productCode": "revitapp",
            "installationId": inst_id,
            "machineFingerprint": fp_hash,
            "displayName": "OFFICE-PC",
            "platform": "windows",
            "revitVersion": "2025",
            "appVersion": "1.0.0",
        },
    )
    assert resp_idem.status_code == 200
    assert resp_idem.json()["deviceId"] == data["deviceId"]


@pytest.mark.asyncio
async def test_admin_reset_device_trial(client: TestClient) -> None:
    fp_hash = "fp_to_reset_123"

    async with TestSessionLocal() as session:
        admin = User(
            email="superadmin@example.com",
            hashed_password="hash",
            role=UserRole.ADMIN,
            is_active=True,
        )
        user = User(
            email="client@example.com",
            hashed_password="hash",
            role=UserRole.USER,
            is_active=True,
        )
        session.add_all([admin, user])
        await session.flush()

        trial = DeviceTrial(
            fingerprint_hash=fp_hash,
            display_name="TEST-PC",
            first_trial_at=datetime.now(timezone.utc) - timedelta(days=20),
            trial_expires_at=datetime.now(timezone.utc) - timedelta(days=6),
            status=DeviceTrialStatus.EXPIRED,
        )
        session.add(trial)
        await session.commit()
        await session.refresh(trial)
        admin_id = admin.id
        user_id = user.id
        trial_id = trial.id

    admin_token = create_access_token(user_id=admin_id, email="superadmin@example.com", role="ADMIN")
    user_token = create_access_token(user_id=user_id, email="client@example.com")

    # Admin calls reset trial
    reset_resp = client.post(
        f"/api/v1/admin/device-trials/{trial_id}/reset",
        headers={"Authorization": f"Bearer {admin_token}"},
        params={"days": 14},
    )
    assert reset_resp.status_code == 200
    assert reset_resp.json()["resetCount"] == 1

    # Now user activates on this machine -> Succeeds again!
    act_resp = client.post(
        "/api/v1/devices/activate",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "productCode": "revitapp",
            "installationId": str(uuid.uuid4()),
            "machineFingerprint": fp_hash,
            "displayName": "TEST-PC",
            "platform": "windows",
            "revitVersion": "2025",
            "appVersion": "1.0.0",
        },
    )
    assert act_resp.status_code == 200
    assert act_resp.json()["isTrial"] is True
