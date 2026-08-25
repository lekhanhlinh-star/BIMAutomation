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

    # Reset only clears a session; an expired machine never receives a second trial.
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
    assert act_resp.status_code == 403
    assert act_resp.json()["detail"] == "trial_expired_on_device"


@pytest.mark.asyncio
async def test_single_active_device_concurrency_and_takeover(client: TestClient) -> None:
    """
    Validates:
    1. User logs in on Machine A (HWID A) -> Entitlement Allowed (Active device = A)
    2. User logs in on Machine B (HWID B) -> Takes over active session (Active device = B)
    3. Machine A sends periodic check / heartbeat -> Rejected with concurrent_session_conflict
    4. Machine A logs in / reactivates -> Takes back active session (Active device = A)
    5. Machine B sends heartbeat -> Rejected with concurrent_session_conflict
    """
    fp_a = "fp_machine_A_11111111111111111111111111111111"
    fp_b = "fp_machine_B_22222222222222222222222222222222"

    async with TestSessionLocal() as session:
        user = User(
            email="concurrent_engineer@example.com",
            hashed_password="hash",
            role=UserRole.USER,
            is_active=True,
            is_trial_registered=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        user_id = user.id

    token = create_access_token(user_id=user_id, email="concurrent_engineer@example.com")

    # Step 1: Check entitlement from Machine A -> Granted, Active = A
    res_a1 = client.post(
        "/api/v1/entitlements/check",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "product_code": "revitapp",
            "hardware_fingerprint": fp_a,
            "device_name": "OFFICE-PC-A",
            "takeover": True,
        },
    )
    assert res_a1.status_code == 200
    data_a1 = res_a1.json()
    assert data_a1["allowed"] is True

    # Machine A heartbeat succeeds
    hb_a1 = client.post(
        "/api/v1/devices/heartbeat",
        headers={"Authorization": f"Bearer {token}"},
        json={"machineFingerprint": fp_a},
    )
    assert hb_a1.status_code == 200
    assert hb_a1.json()["status"] == "ok"

    # Step 2: User opens Revit on Machine B -> Machine B takes over active session
    res_b1 = client.post(
        "/api/v1/entitlements/check",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "product_code": "revitapp",
            "hardware_fingerprint": fp_b,
            "device_name": "HOME-LAPTOP-B",
            "takeover": True,
        },
    )
    assert res_b1.status_code == 200
    data_b1 = res_b1.json()
    assert data_b1["allowed"] is True

    # Step 3: Machine A sends background heartbeat / periodic check -> REJECTED!
    hb_a2 = client.post(
        "/api/v1/devices/heartbeat",
        headers={"Authorization": f"Bearer {token}"},
        json={"machineFingerprint": fp_a},
    )
    assert hb_a2.status_code == 200
    data_hb_a2 = hb_a2.json()
    assert data_hb_a2["status"] == "conflict"
    assert data_hb_a2["error"] == "concurrent_session_conflict"
    assert "HOME-LAPTOP-B" in data_hb_a2["message"]

    # Periodic check from Machine A also fails
    res_a_periodic = client.post(
        "/api/v1/entitlements/check",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "product_code": "revitapp",
            "hardware_fingerprint": fp_a,
            "device_name": "OFFICE-PC-A",
            "takeover": False,
            "is_periodic": True,
        },
    )
    assert res_a_periodic.status_code == 200
    assert res_a_periodic.json()["allowed"] is False
    assert res_a_periodic.json()["error"] == "concurrent_session_conflict"

    # Step 4: Machine A user clicks "Tiếp tục trên máy này" (Takeover = True) -> Regains access
    res_a_takeover = client.post(
        "/api/v1/entitlements/check",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "product_code": "revitapp",
            "hardware_fingerprint": fp_a,
            "device_name": "OFFICE-PC-A",
            "takeover": True,
            "is_periodic": False,
        },
    )
    assert res_a_takeover.status_code == 200
    assert res_a_takeover.json()["allowed"] is True

    # Step 5: Machine B heartbeat is now kicked out
    hb_b2 = client.post(
        "/api/v1/devices/heartbeat",
        headers={"Authorization": f"Bearer {token}"},
        json={"machineFingerprint": fp_b},
    )
    assert hb_b2.status_code == 200
    data_hb_b2 = hb_b2.json()
    assert data_hb_b2["status"] == "conflict"
    assert data_hb_b2["error"] == "concurrent_session_conflict"
    assert "OFFICE-PC-A" in data_hb_b2["message"]


@pytest.mark.asyncio
async def test_explicit_activation_moves_trial_to_second_machine(
    client: TestClient,
) -> None:
    """Periodic entitlement checks fail closed, but explicit activation moves the session."""
    async with TestSessionLocal() as session:
        user = User(
            email="strict_single_device@example.com",
            hashed_password="hash",
            role=UserRole.USER,
            is_active=True,
            is_trial_registered=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        user_id = user.id

    token = create_access_token(
        user_id=user_id,
        email="strict_single_device@example.com",
    )
    headers = {"Authorization": f"Bearer {token}"}

    machine_a = client.post(
        "/api/v1/entitlements/check",
        headers=headers,
        json={
            "product_code": "revitapp",
            "hardware_fingerprint": "strict_fp_machine_a",
            "device_name": "STRICT-PC-A",
        },
    )
    assert machine_a.status_code == 200
    assert machine_a.json()["allowed"] is True

    machine_b = client.post(
        "/api/v1/entitlements/check",
        headers=headers,
        json={
            "product_code": "revitapp",
            "hardware_fingerprint": "strict_fp_machine_b",
            "device_name": "STRICT-PC-B",
        },
    )
    assert machine_b.status_code == 200
    assert machine_b.json()["allowed"] is False
    assert machine_b.json()["error"] == "concurrent_session_conflict"
    assert "STRICT-PC-A" in machine_b.json()["message"]

    activation_b = client.post(
        "/api/v1/devices/activate",
        headers=headers,
        json={
            "productCode": "revitapp",
            "installationId": str(uuid.uuid4()),
            "machineFingerprint": "strict_fp_machine_b",
            "displayName": "STRICT-PC-B",
            "platform": "windows",
            "revitVersion": "2025",
            "appVersion": "1.0.0",
        },
    )
    assert activation_b.status_code == 200
    assert activation_b.json()["isTrial"] is True

    heartbeat_a = client.post(
        "/api/v1/devices/heartbeat",
        headers=headers,
        json={"machineFingerprint": "strict_fp_machine_a"},
    )
    assert heartbeat_a.status_code == 200
    assert heartbeat_a.json()["allowed"] is False
    assert heartbeat_a.json()["error"] == "concurrent_session_conflict"

    heartbeat_without_fingerprint = client.post(
        "/api/v1/devices/heartbeat",
        headers=headers,
        json={},
    )
    assert heartbeat_without_fingerprint.status_code == 200
    assert heartbeat_without_fingerprint.json()["allowed"] is False
    assert heartbeat_without_fingerprint.json()["error"] == "fingerprint_required"


@pytest.mark.asyncio
async def test_trial_moves_without_resetting_account_clock_and_machine_is_used_once(
    client: TestClient,
) -> None:
    fp_a = "portable_trial_machine_a"
    fp_b = "portable_trial_machine_b"
    now = datetime.now(timezone.utc)
    account_expires_at = now + timedelta(days=5)

    async with TestSessionLocal() as session:
        user = User(
            email="portable_trial@example.com",
            hashed_password="hash",
            role=UserRole.USER,
            is_active=True,
            is_trial_registered=True,
            trial_started_at=now - timedelta(days=9),
            trial_expires_at=account_expires_at,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        user_id = user.id

    token = create_access_token(user_id=user_id, email="portable_trial@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    for fingerprint, name in [(fp_a, "PORTABLE-A"), (fp_b, "PORTABLE-B")]:
        response = client.post(
            "/api/v1/devices/activate",
            headers=headers,
            json={
                "productCode": "revitapp",
                "installationId": str(uuid.uuid4()),
                "machineFingerprint": fingerprint,
                "displayName": name,
                "platform": "windows",
                "revitVersion": "2025",
                "appVersion": "1.0.0",
            },
        )
        assert response.status_code == 200
        assert response.json()["isTrial"] is True
        returned_expiry = datetime.fromisoformat(response.json()["expiresAt"])
        assert abs((returned_expiry - account_expires_at).total_seconds()) < 2

    async with TestSessionLocal() as session:
        trials = (
            await session.execute(
                select(DeviceTrial).where(
                    DeviceTrial.fingerprint_hash.in_([fp_a, fp_b])
                )
            )
        ).scalars().all()
        assert len(trials) == 2
        assert all(
            abs((trial.trial_expires_at.replace(tzinfo=timezone.utc) - account_expires_at).total_seconds()) < 2
            for trial in trials
        )

        machine_a = next(t for t in trials if t.fingerprint_hash == fp_a)
        machine_a.trial_expires_at = now - timedelta(seconds=1)
        machine_a.status = DeviceTrialStatus.EXPIRED
        await session.commit()

    reused_machine = client.post(
        "/api/v1/devices/activate",
        headers=headers,
        json={
            "productCode": "revitapp",
            "installationId": str(uuid.uuid4()),
            "machineFingerprint": fp_a,
            "displayName": "PORTABLE-A",
            "platform": "windows",
            "revitVersion": "2025",
            "appVersion": "1.0.0",
        },
    )
    assert reused_machine.status_code == 403
    assert reused_machine.json()["detail"] == "trial_expired_on_device"


@pytest.mark.asyncio
async def test_camel_case_periodic_flag_cannot_take_over_active_machine(
    client: TestClient,
) -> None:
    async with TestSessionLocal() as session:
        user = User(
            email="camel_periodic@example.com",
            hashed_password="hash",
            role=UserRole.USER,
            is_active=True,
            is_trial_registered=True,
            active_device_fingerprint="camel_fp_machine_a",
            active_device_name="CAMEL-PC-A",
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        user_id = user.id

    token = create_access_token(user_id=user_id, email="camel_periodic@example.com")
    response = client.post(
        "/api/v1/entitlements/check",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "productCode": "revitapp",
            "hardwareFingerprint": "camel_fp_machine_b",
            "deviceName": "CAMEL-PC-B",
            "takeover": True,
            "isPeriodic": True,
        },
    )
    assert response.status_code == 200
    assert response.json()["allowed"] is False
    assert response.json()["error"] == "concurrent_session_conflict"


@pytest.mark.asyncio
async def test_admin_online_status_uses_recent_server_activity(
    client: TestClient,
) -> None:
    now = datetime.now(timezone.utc)
    async with TestSessionLocal() as session:
        admin = User(
            email="presence_admin@example.com",
            hashed_password="hash",
            role=UserRole.ADMIN,
            is_active=True,
        )
        fresh_user = User(
            email="fresh_presence@example.com",
            hashed_password="hash",
            role=UserRole.USER,
            is_active=True,
            active_device_fingerprint="presence_fresh_fp",
            active_device_name="FRESH-PC",
            active_device_last_seen=now - timedelta(minutes=2),
        )
        stale_user = User(
            email="stale_presence@example.com",
            hashed_password="hash",
            role=UserRole.USER,
            is_active=True,
            active_device_fingerprint="presence_stale_fp",
            active_device_name="STALE-PC",
            active_device_last_seen=now - timedelta(minutes=10),
        )
        session.add_all([admin, fresh_user, stale_user])
        await session.flush()
        session.add_all(
            [
                DeviceTrial(
                    fingerprint_hash="presence_fresh_fp",
                    display_name="FRESH-PC",
                    platform="windows",
                    revit_version="2025",
                    app_version="1.0.0",
                    first_trial_at=now,
                    trial_expires_at=now + timedelta(days=14),
                    initial_user_id=fresh_user.id,
                    last_user_id=fresh_user.id,
                    status=DeviceTrialStatus.ACTIVE,
                ),
                DeviceTrial(
                    fingerprint_hash="presence_stale_fp",
                    display_name="STALE-PC",
                    platform="windows",
                    revit_version="2025",
                    app_version="1.0.0",
                    first_trial_at=now,
                    trial_expires_at=now + timedelta(days=14),
                    initial_user_id=stale_user.id,
                    last_user_id=stale_user.id,
                    status=DeviceTrialStatus.ACTIVE,
                ),
                License(
                    license_key="PRESENCE-PAID-LICENSE",
                    user_id=fresh_user.id,
                    plan_name="monthly",
                    status=LicenseStatus.ACTIVE,
                    starts_at=now,
                    expires_at=now + timedelta(days=30),
                ),
            ]
        )
        await session.commit()
        admin_id = admin.id

    admin_token = create_access_token(
        user_id=admin_id,
        email="presence_admin@example.com",
        role="ADMIN",
    )
    headers = {"Authorization": f"Bearer {admin_token}"}

    trials_response = client.get("/api/v1/admin/device-trials", headers=headers)
    assert trials_response.status_code == 200
    trials_by_fp = {item["fingerprint_hash"]: item for item in trials_response.json()}
    assert trials_by_fp["presence_fresh_fp"]["is_currently_online"] is True
    assert trials_by_fp["presence_stale_fp"]["is_currently_online"] is False
    assert trials_by_fp["presence_fresh_fp"]["last_seen_at"] is not None

    licenses_response = client.get("/api/v1/admin/licenses", headers=headers)
    assert licenses_response.status_code == 200
    paid_license = next(
        item for item in licenses_response.json() if item["license_key"] == "PRESENCE-PAID-LICENSE"
    )
    assert paid_license["is_currently_online"] is True
    assert paid_license["last_seen_at"] is not None


@pytest.mark.asyncio
async def test_bi_directional_trial_abuse_prevent_forged_hwid_on_same_user(client: TestClient) -> None:
    """
    Validates that a single user account CANNOT bypass 14-day trial limits
    by sending continuously forged/random hardware fingerprints.
    """
    fp_1 = "fp_first_machine_11111111111111111111111"
    fp_forged = "fp_forged_machine_22222222222222222222222"

    async with TestSessionLocal() as session:
        user = User(
            email="forger@example.com",
            hashed_password="hash",
            role=UserRole.USER,
            is_active=True,
            is_trial_registered=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        user_id = user.id

    token = create_access_token(user_id=user_id, email="forger@example.com")

    # 1. User starts 14-day trial on Machine 1
    res1 = client.post(
        "/api/v1/entitlements/check",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "product_code": "revitapp",
            "hardware_fingerprint": fp_1,
            "device_name": "MACHINE-1",
        },
    )
    assert res1.status_code == 200
    assert res1.json()["allowed"] is True
    assert res1.json()["isTrial"] is True

    # 2. Simulate User's personal 14-day trial expiring
    async with TestSessionLocal() as session:
        u = (await session.execute(select(User).where(User.id == user_id))).scalar_one()
        u.trial_expires_at = datetime.now(timezone.utc) - timedelta(days=1)
        await session.commit()

    # 3. User attempts to generate a new trial on a "brand new" forged HWID -> REJECTED!
    res_forged = client.post(
        "/api/v1/entitlements/check",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "product_code": "revitapp",
            "hardware_fingerprint": fp_forged,
            "device_name": "FORGED-MACHINE",
        },
    )
    assert res_forged.status_code == 200
    data_forged = res_forged.json()
    assert data_forged["allowed"] is False
    assert data_forged["error"] == "trial_expired_for_user"


@pytest.mark.asyncio
async def test_entitlement_signed_token_and_public_key(client: TestClient) -> None:
    """
    Validates RS256 Signed License Token generation, 72h Grace Period, and Public Key export.
    """
    from app.core.license_crypto import verify_license_token

    # 1. Test Public Key endpoint
    pk_resp = client.get("/api/v1/entitlements/public-key")
    assert pk_resp.status_code == 200
    pk_data = pk_resp.json()
    assert pk_data["algorithm"] == "RS256"
    assert "BEGIN PUBLIC KEY" in pk_data["pem"]
    assert "<RSAKeyValue>" in pk_data["xml"]

    # 2. Test Entitlement Check returns RS256 signed token
    async with TestSessionLocal() as session:
        user = User(
            email="crypto_user@example.com",
            hashed_password="hash",
            role=UserRole.USER,
            is_active=True,
            is_trial_registered=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        user_id = user.id

    token = create_access_token(user_id=user_id, email="crypto_user@example.com")
    fp = "fp_crypto_test_1234567890abcdef"

    res = client.post(
        "/api/v1/entitlements/check",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "product_code": "revitapp",
            "hardware_fingerprint": fp,
            "device_name": "CRYPTO-WORKSTATION",
        },
    )
    assert res.status_code == 200
    ent_data = res.json()
    assert ent_data["allowed"] is True
    assert ent_data["gracePeriodHours"] == 12
    assert ent_data["signedLicenseToken"] is not None

    # 3. Verify cryptographic token signature and payload
    decoded = verify_license_token(ent_data["signedLicenseToken"])
    assert decoded["email"] == "crypto_user@example.com"
    assert decoded["hwid"] == fp
    assert decoded["grace_period_hours"] == 12
    assert len(decoded["features"]) == 13
