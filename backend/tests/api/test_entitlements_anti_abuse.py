from datetime import datetime, timedelta, timezone
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.license_crypto import (
    compute_payload_hmac,
    get_public_key_pem,
    sign_license_token,
    verify_license_token,
    verify_payload_hmac,
)
from app.models.device_trial import DeviceTrial, DeviceTrialStatus
from app.models.license import License, LicenseStatus
from app.models.user import User, UserRole
from app.services.token_service import create_access_token
from tests.conftest import TestSessionLocal


@pytest.mark.asyncio
async def test_first_time_trial_grant_with_telemetry(client: TestClient) -> None:
    """
    Test 1: First-time user with complete hardware telemetry and valid HMAC gets 14-day trial,
    grace_period_hours = 12, and trialQuota configuration.
    """
    async with TestSessionLocal() as session:
        user = User(
            email="trial_user_001@example.com",
            hashed_password="pw",
            role=UserRole.USER,
            is_trial_registered=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        user_id = user.id

    token = create_access_token(user_id=user_id, email="trial_user_001@example.com", role="USER")
    headers = {"Authorization": f"Bearer {token}"}

    now_ts = int(datetime.now(timezone.utc).timestamp())
    bios_uuid = "4C4C4544-0030-4A10-8043-B2C04F343833"
    cpu_id = "BFEBFBFF000906EA"
    motherboard_serial = "/8G1234/CN7220083B0012/"
    disk_serial = "0025_38B4_0146_3256"
    mac_addr = "00:1A:2B:3C:4D:5E"
    machine_guid = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
    fp_hash = "fphash_machine_alpha_001"

    sig = compute_payload_hmac(
        timestamp=now_ts,
        bios_uuid=bios_uuid,
        cpu_id=cpu_id,
        motherboard_serial=motherboard_serial,
        disk_serial=disk_serial,
        mac_address=mac_addr,
        machine_guid=machine_guid,
    )

    req_body = {
        "product_code": "revitapp",
        "hardware_fingerprint": fp_hash,
        "device_name": "Workstation Alpha",
        "revit_version": "2025",
        "app_version": "1.0.4",
        "bios_uuid": bios_uuid,
        "cpu_id": cpu_id,
        "motherboard_serial": motherboard_serial,
        "disk_serial": disk_serial,
        "mac_address": mac_addr,
        "machine_guid": machine_guid,
        "request_timestamp": now_ts,
        "request_signature": sig,
    }

    res = client.post("/api/v1/entitlements/check", json=req_body, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["allowed"] is True
    assert data["isTrial"] is True
    assert data["gracePeriodHours"] == 12
    assert data["grace_period_hours"] == 12
    assert data["trialQuota"] is None

    incomplete_signed_request = req_body | {"request_signature": None}
    invalid_res = client.post(
        "/api/v1/entitlements/check",
        json=incomplete_signed_request,
        headers=headers,
    )
    assert invalid_res.json()["error"] == "invalid_signature"

    # Verify device trial in DB
    async with TestSessionLocal() as session:
        trial_res = await session.execute(
            select(DeviceTrial).where(DeviceTrial.bios_uuid == bios_uuid.lower())
        )
        saved_trial = trial_res.scalar_one_or_none()
        assert saved_trial is not None
        assert saved_trial.motherboard_serial == motherboard_serial.lower()
        assert saved_trial.disk_serial == disk_serial.lower()
        assert saved_trial.app_version == "1.0.4"


@pytest.mark.asyncio
async def test_sybil_attack_new_account_same_bios_uuid_blocked(client: TestClient) -> None:
    """
    Test 2: Attacker creates a brand new account with a new email on the same physical machine.
    Since the trial expired on this BIOS UUID, the new account is strictly blocked.
    """
    # 1. Seed an expired DeviceTrial for this physical BIOS UUID
    bios_uuid = "3A3A3A3A-1111-2222-3333-444444444444"
    motherboard_serial = "MB-SERIAL-ORIGINAL-999"
    disk_serial = "DISK-SERIAL-ORIGINAL-888"

    async with TestSessionLocal() as session:
        expired_trial = DeviceTrial(
            fingerprint_hash="fp_original_hash_old",
            bios_uuid=bios_uuid.lower(),
            motherboard_serial=motherboard_serial.lower(),
            disk_serial=disk_serial.lower(),
            display_name="Workstation Victim",
            platform="windows",
            revit_version="2025",
            first_trial_at=datetime.now(timezone.utc) - timedelta(days=20),
            trial_expires_at=datetime.now(timezone.utc) - timedelta(days=6),
            status=DeviceTrialStatus.ACTIVE,
        )
        session.add(expired_trial)

        # New user
        sybil_user = User(
            email="sybil_attacker_002@example.com",
            hashed_password="pw",
            role=UserRole.USER,
            is_trial_registered=True,
        )
        session.add(sybil_user)
        await session.commit()
        await session.refresh(sybil_user)
        sybil_user_id = sybil_user.id

    token = create_access_token(user_id=sybil_user_id, email="sybil_attacker_002@example.com", role="USER")
    headers = {"Authorization": f"Bearer {token}"}

    # Attacker tries to generate a new fingerprint hash, but the physical BIOS UUID is identical
    now_ts = int(datetime.now(timezone.utc).timestamp())
    request_signature = compute_payload_hmac(
        timestamp=now_ts,
        bios_uuid=bios_uuid,
        motherboard_serial=motherboard_serial,
        disk_serial=disk_serial,
        machine_guid="fake-new-guid-12345",
    )
    req_body = {
        "product_code": "revitapp",
        "hardware_fingerprint": "fp_fake_new_hash_9999",
        "device_name": "Workstation Attacker",
        "bios_uuid": bios_uuid,
        "motherboard_serial": motherboard_serial,
        "disk_serial": disk_serial,
        "machine_guid": "fake-new-guid-12345",
        "request_timestamp": now_ts,
        "request_signature": request_signature,
    }

    res = client.post("/api/v1/entitlements/check", json=req_body, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["allowed"] is False
    assert data["error"] == "trial_expired_on_device"
    assert "hết 14 ngày dùng thử" in data["message"]


@pytest.mark.asyncio
async def test_sybil_attack_registry_guid_tampering_same_motherboard_or_disk(client: TestClient) -> None:
    """
    Test 3: Attacker changes Registry MachineGuid, but Motherboard & Disk Serial match expired trial.
    The system catches them and denies trial.
    """
    mb_serial = "MB-MATCH-TARGET-7777"
    disk_serial = "DISK-MATCH-TARGET-6666"

    async with TestSessionLocal() as session:
        expired_trial = DeviceTrial(
            fingerprint_hash="fp_old_target_7777",
            bios_uuid=None,  # Even if BIOS was not captured
            motherboard_serial=mb_serial.lower(),
            disk_serial=disk_serial.lower(),
            display_name="Workstation Target",
            first_trial_at=datetime.now(timezone.utc) - timedelta(days=30),
            trial_expires_at=datetime.now(timezone.utc) - timedelta(days=16),
            status=DeviceTrialStatus.ACTIVE,
        )
        session.add(expired_trial)

        user = User(
            email="fresh_user_003@example.com",
            hashed_password="pw",
            role=UserRole.USER,
            is_trial_registered=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        user_id = user.id

    token = create_access_token(user_id=user_id, email="fresh_user_003@example.com", role="USER")
    headers = {"Authorization": f"Bearer {token}"}

    now_ts = int(datetime.now(timezone.utc).timestamp())
    request_signature = compute_payload_hmac(
        timestamp=now_ts,
        bios_uuid="unknown",
        motherboard_serial=mb_serial,
        disk_serial=disk_serial,
        machine_guid="spoofed-guid-7777",
    )
    req_body = {
        "product_code": "revitapp",
        "hardware_fingerprint": "fp_spoofed_random_abc",
        "device_name": "Workstation Tampered",
        "bios_uuid": "unknown",
        "motherboard_serial": mb_serial,
        "disk_serial": disk_serial,
        "machine_guid": "spoofed-guid-7777",
        "request_timestamp": now_ts,
        "request_signature": request_signature,
    }

    res = client.post("/api/v1/entitlements/check", json=req_body, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["allowed"] is False
    assert data["error"] == "trial_expired_on_device"


@pytest.mark.asyncio
async def test_hmac_tampered_payload_rejected(client: TestClient) -> None:
    """
    Test 4: Attacker alters hardware parameter in JSON body without valid HMAC signature.
    Server returns allowed=False, error="invalid_signature".
    """
    async with TestSessionLocal() as session:
        user = User(email="hmac_user@example.com", hashed_password="pw", role=UserRole.USER, is_trial_registered=True)
        session.add(user)
        await session.commit()
        await session.refresh(user)
        user_id = user.id

    token = create_access_token(user_id=user_id, email="hmac_user@example.com", role="USER")
    headers = {"Authorization": f"Bearer {token}"}

    now_ts = int(datetime.now(timezone.utc).timestamp())
    valid_sig = compute_payload_hmac(
        timestamp=now_ts,
        bios_uuid="BIOS-REAL-111",
        cpu_id="CPU-REAL-222",
    )

    # Attacker tampers with bios_uuid to "BIOS-TAMPERED-999" but sends original signature
    req_body = {
        "product_code": "revitapp",
        "hardware_fingerprint": "fp_hmac_test",
        "bios_uuid": "BIOS-TAMPERED-999",
        "cpu_id": "CPU-REAL-222",
        "request_timestamp": now_ts,
        "request_signature": valid_sig,
    }

    res = client.post("/api/v1/entitlements/check", json=req_body, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["allowed"] is False
    assert data["error"] == "invalid_signature"


@pytest.mark.asyncio
async def test_hmac_replay_attack_expired_timestamp_rejected(client: TestClient) -> None:
    """
    Test 5: Replay attack with timestamp > 5 minutes in the past is rejected.
    """
    async with TestSessionLocal() as session:
        user = User(email="replay_user@example.com", hashed_password="pw", role=UserRole.USER, is_trial_registered=True)
        session.add(user)
        await session.commit()
        await session.refresh(user)
        user_id = user.id

    token = create_access_token(user_id=user_id, email="replay_user@example.com", role="USER")
    headers = {"Authorization": f"Bearer {token}"}

    # 10 minutes ago
    old_ts = int(datetime.now(timezone.utc).timestamp()) - 600
    sig = compute_payload_hmac(
        timestamp=old_ts,
        bios_uuid="BIOS-REPLAY-111",
    )

    req_body = {
        "product_code": "revitapp",
        "hardware_fingerprint": "fp_replay_test",
        "bios_uuid": "BIOS-REPLAY-111",
        "request_timestamp": old_ts,
        "request_signature": sig,
    }

    res = client.post("/api/v1/entitlements/check", json=req_body, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["allowed"] is False
    assert data["error"] == "invalid_signature"
    assert "quá hạn" in data["message"]


@pytest.mark.asyncio
async def test_paid_license_gets_72h_grace_period_and_no_quota(client: TestClient) -> None:
    """
    Test 6: User with active Paid License gets gracePeriodHours = 72, trialQuota = None, isTrial = False.
    """
    async with TestSessionLocal() as session:
        user = User(email="paid_user@example.com", hashed_password="pw", role=UserRole.USER)
        session.add(user)
        await session.flush()

        license_obj = License(
            license_key="BP-PAID-TEST-KEY-777",
            user_id=user.id,
            status=LicenseStatus.ACTIVE,
            starts_at=datetime.now(timezone.utc),
            expires_at=datetime.now(timezone.utc) + timedelta(days=365),
            plan_name="Enterprise 1 Year",
        )
        session.add(license_obj)
        await session.commit()
        await session.refresh(user)
        user_id = user.id

    token = create_access_token(user_id=user_id, email="paid_user@example.com", role="USER")
    headers = {"Authorization": f"Bearer {token}"}

    req_body = {
        "product_code": "revitapp",
        "hardware_fingerprint": "fp_paid_machine_001",
        "device_name": "Workstation Paid",
    }

    res = client.post("/api/v1/entitlements/check", json=req_body, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["allowed"] is True
    assert data["isTrial"] is False
    assert data["gracePeriodHours"] == 72
    assert data["trialQuota"] is None
    assert data["plan"] == "Enterprise 1 Year"


@pytest.mark.asyncio
async def test_virtual_machine_trial_blocked(client: TestClient) -> None:
    """
    Test 7: Virtual Machine / Sandbox trial requests return virtual_machine_not_allowed.
    """
    async with TestSessionLocal() as session:
        user = User(email="vm_user@example.com", hashed_password="pw", role=UserRole.USER, is_trial_registered=True)
        session.add(user)
        await session.commit()
        await session.refresh(user)
        user_id = user.id

    token = create_access_token(user_id=user_id, email="vm_user@example.com", role="USER")
    headers = {"Authorization": f"Bearer {token}"}

    # Case A: Explicit is_virtual_machine = True
    req_body_a = {
        "product_code": "revitapp",
        "hardware_fingerprint": "fp_vm_test_001",
        "device_name": "VM-WORKSTATION",
        "is_virtual_machine": True,
    }
    res_a = client.post("/api/v1/entitlements/check", json=req_body_a, headers=headers)
    assert res_a.status_code == 200
    data_a = res_a.json()
    assert data_a["allowed"] is False
    assert data_a["error"] == "virtual_machine_not_allowed"
    assert "máy ảo" in data_a["message"]

    # Case B: VM indicator detected in BIOS or Motherboard string
    req_body_b = {
        "product_code": "revitapp",
        "hardware_fingerprint": "fp_vm_test_002",
        "bios_uuid": "VMware-42 1a 8b...",
        "motherboard_serial": "VirtualBox-MB",
    }
    res_b = client.post("/api/v1/entitlements/check", json=req_body_b, headers=headers)
    assert res_b.status_code == 200
    data_b = res_b.json()
    assert data_b["allowed"] is False
    assert data_b["error"] == "virtual_machine_not_allowed"


@pytest.mark.asyncio
async def test_csharp_hardware_telemetry_compatibility_and_aliases(client: TestClient) -> None:
    """
    Test 8: Exact compatibility with C# Revit Add-in HardwareTelemetry.cs.
    Supports processor_id/baseboard_serial, processorId/baseboardSerial, and exact canonical string HMAC.
    """
    async with TestSessionLocal() as session:
        user = User(
            email="csharp_client_user@example.com",
            hashed_password="pw",
            role=UserRole.USER,
            is_trial_registered=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        user_id = user.id

    token = create_access_token(user_id=user_id, email="csharp_client_user@example.com", role="USER")
    headers = {"Authorization": f"Bearer {token}"}

    now_ts = int(datetime.now(timezone.utc).timestamp())
    bios_uuid = "4C4C4544-0030-4A10-8043-B2C04F343833"
    processor_id = "BFEBFBFF000906EA"
    baseboard_serial = "/8G1234/CN7220083B0012/"
    disk_serial = "0025_38B4_0146_3256"
    mac_addr = "00:1A:2B:3C:4D:5E"
    machine_guid = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
    fp_hash = "fphash_csharp_001"

    # HardwareTelemetry.BuildCanonicalString preserves case and joins the
    # trimmed signals in this exact order.
    raw_canonical = f"{now_ts}:{bios_uuid}:{processor_id}:{baseboard_serial}:{disk_serial}:{mac_addr}:{machine_guid}"
    import hmac, hashlib
    expected_hmac = hmac.new(b"bimauto_telemetry_secure_sign_2026", raw_canonical.encode("utf-8"), hashlib.sha256).hexdigest()

    # Case A: Request body using snake_case processor_id and baseboard_serial
    req_body_a = {
        "product_code": "revitapp",
        "hardware_fingerprint": fp_hash,
        "device_name": "DESKTOP-REVIT",
        "revit_version": "2025",
        "bios_uuid": bios_uuid,
        "processor_id": processor_id,
        "baseboard_serial": baseboard_serial,
        "disk_serial": disk_serial,
        "mac_address": mac_addr,
        "machine_guid": machine_guid,
        "request_timestamp": now_ts,
        "request_signature": expected_hmac,
    }

    res_a = client.post("/api/v1/entitlements/check", json=req_body_a, headers=headers)
    assert res_a.status_code == 200
    data_a = res_a.json()
    assert data_a["allowed"] is True
    assert data_a["error"] is None

    # Case B: Request body using camelCase (C# System.Text.Json default).
    req_body_b = {
        "productCode": "revitapp",
        "hardwareFingerprint": fp_hash,
        "deviceName": "DESKTOP-REVIT-2",
        "revitVersion": "2025",
        "biosUuid": bios_uuid,
        "processorId": processor_id,
        "baseboardSerial": baseboard_serial,
        "diskSerial": disk_serial,
        "macAddress": mac_addr,
        "machineGuid": machine_guid,
        "requestTimestamp": now_ts,
        "requestSignature": expected_hmac,
    }

    res_b = client.post("/api/v1/entitlements/check", json=req_body_b, headers=headers)
    assert res_b.status_code == 200
    data_b = res_b.json()
    assert data_b["allowed"] is True
    assert data_b["error"] is None


def test_hardware_telemetry_contract_vector_and_unknown_signal() -> None:
    """Locks the backend to the canonical vector supplied by the add-in team."""
    signature = compute_payload_hmac(
        timestamp=1756000000,
        bios_uuid="4C4C4544-0034-3010-8054-B4C04F565033",
        processor_id="BFEBFBFF000806EA",
        baseboard_serial="PF2M8XYZ",
        disk_serial="S4EWNX0R123456",
        mac_address=None,
        machine_guid="1f3d4b7a-2c8e-4a1b-9d6f-0e5a7c3b2d19",
    )

    assert signature == "176a02ceb73d4c922f53ba06d72010ba90726f6d030ebab51e5c3fcc6b084bb5"


def test_hardware_telemetry_signature_format_is_strict() -> None:
    signature = compute_payload_hmac(timestamp=1756000000)

    assert verify_payload_hmac(
        signature=f"sha256={signature}",
        timestamp=1756000000,
        tolerance_seconds=10**9,
    )[0] is False
    assert verify_payload_hmac(
        signature=signature.upper(),
        timestamp=1756000000,
        tolerance_seconds=10**9,
    )[0] is False
