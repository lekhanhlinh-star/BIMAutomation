from datetime import datetime, timedelta, timezone
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.license_crypto import (
    get_public_key_pem,
    get_public_key_xml,
    sign_license_token,
    verify_license_token,
)
from app.models.device_trial import DeviceTrial, DeviceTrialStatus
from app.models.license import License, LicenseStatus
from app.models.user import User, UserRole
from app.services.entitlement_service import ALL_FEATURES, resolve_features
from app.services.token_service import create_access_token
from tests.conftest import TestSessionLocal


@pytest.mark.asyncio
async def test_all_13_features_across_all_plans() -> None:
    """
    Scenario 1: Exhaustive verification that all 13 features are granted
    across EVERY plan type without exception.
    """
    assert len(ALL_FEATURES) == 13
    
    plan_types = [
        "trial",
        "14-day free trial",
        "standard",
        "monthly",
        "pro",
        "annual",
        "professional",
        "enterprise",
        "unknown-custom-plan",
    ]
    
    for plan in plan_types:
        feats = resolve_features(plan, [])
        assert len(feats) == 13, f"Plan {plan} did not resolve all 13 features! Got {len(feats)}"
        for required_feat in ALL_FEATURES:
            assert required_feat in feats, f"Feature {required_feat} missing in plan {plan}"


@pytest.mark.asyncio
async def test_asymmetric_rs256_cryptographic_tamper_proofing() -> None:
    """
    Scenario 2: RS256 token verification, tamper detection, and public key export.
    """
    # 1. Check Public Key formats
    pem = get_public_key_pem()
    xml = get_public_key_xml()
    assert "BEGIN PUBLIC KEY" in pem
    assert "<RSAKeyValue><Modulus>" in xml
    assert "<Exponent>" in xml

    # 2. Sign a valid token
    user_uuid = uuid.uuid4()
    hwid = "hwid_original_machine_sha256"
    now = datetime.now(timezone.utc)
    token = sign_license_token(
        user_id=user_uuid,
        email="test_crypto@example.com",
        hwid=hwid,
        product_code="revitapp",
        plan_name="Pro",
        is_trial=False,
        features=ALL_FEATURES,
        expires_at=now + timedelta(days=30),
        grace_period_hours=72,
    )
    assert token is not None

    # 3. Verify legitimate token
    decoded = verify_license_token(token)
    assert decoded["sub"] == f"usr_{user_uuid}"
    assert decoded["hwid"] == hwid
    assert decoded["plan"] == "Pro"
    assert decoded["grace_period_hours"] == 72
    assert decoded["features"] == ALL_FEATURES

    # 4. Tampering with payload body should fail verification
    parts = token.split(".")
    tampered_payload_b64 = parts[1][:-2] + "AA"  # Corrupt payload bytes
    tampered_token = f"{parts[0]}.{tampered_payload_b64}.{parts[2]}"
    with pytest.raises(Exception):
        verify_license_token(tampered_token)

    # 5. Tampering with signature should fail verification
    tampered_sig = parts[2][:-4] + "AAAA"
    tampered_token_sig = f"{parts[0]}.{parts[1]}.{tampered_sig}"
    with pytest.raises(Exception):
        verify_license_token(tampered_token_sig)


@pytest.mark.asyncio
async def test_bi_directional_anti_abuse_trial_carry_over(client: TestClient) -> None:
    """
    Scenario 3: When a user switches to a new machine during their active 14-day trial,
    the remaining days are carried over (e.g. 9 days left), NOT resetting to a fresh 14 days!
    """
    fp_mach_1 = "fp_machine_first_111111111"
    fp_mach_2 = "fp_machine_second_22222222"

    async with TestSessionLocal() as session:
        user = User(
            email="carryover_user@example.com",
            hashed_password="hash",
            role=UserRole.USER,
            is_active=True,
            is_trial_registered=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        user_id = user.id

    token = create_access_token(user_id=user_id, email="carryover_user@example.com")

    # 1. Start trial on Machine 1 -> 14 days
    res1 = client.post(
        "/api/v1/entitlements/check",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "product_code": "revitapp",
            "hardware_fingerprint": fp_mach_1,
            "device_name": "WORK-PC",
        },
    )
    assert res1.status_code == 200
    assert res1.json()["allowed"] is True

    # 2. Fast-forward 5 days: User has 9 days left on server
    async with TestSessionLocal() as session:
        u = (await session.execute(select(User).where(User.id == user_id))).scalar_one()
        u.trial_expires_at = datetime.now(timezone.utc) + timedelta(days=9)
        await session.commit()

    # 3. User logs into Machine 2 (New HWID) -> Gets 9 days, NOT 14 days!
    res2 = client.post(
        "/api/v1/entitlements/check",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "product_code": "revitapp",
            "hardware_fingerprint": fp_mach_2,
            "device_name": "LAPTOP-HOME",
            "takeover": True,
        },
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["allowed"] is True
    exp_time = datetime.fromisoformat(data2["expiresAt"])
    now = datetime.now(timezone.utc)
    remaining_days = (exp_time - now).total_seconds() / 86400
    assert 8.8 <= remaining_days <= 9.2, f"Expected ~9 days remaining, got {remaining_days}"


@pytest.mark.asyncio
async def test_trial_registration_form_gate(client: TestClient) -> None:
    """
    Scenario 4: User who has NOT completed trial registration form is blocked.
    """
    fp = "fp_unregistered_trial_pc"
    async with TestSessionLocal() as session:
        user = User(
            email="unregistered@example.com",
            hashed_password="hash",
            role=UserRole.USER,
            is_active=True,
            is_trial_registered=False,  # Has not filled registration form
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        user_id = user.id

    token = create_access_token(user_id=user_id, email="unregistered@example.com")

    res = client.post(
        "/api/v1/entitlements/check",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "product_code": "revitapp",
            "hardware_fingerprint": fp,
            "device_name": "PC-NEW",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["allowed"] is False
    assert data["error"] == "trial_registration_required"


@pytest.mark.asyncio
async def test_admin_full_lifecycle_operations(client: TestClient) -> None:
    """
    Scenario 5: Admin full lifecycle operations (Revoke trial -> Blocked -> Grant trial -> Active).
    """
    fp = "fp_admin_lifecycle_test"

    async with TestSessionLocal() as session:
        admin = User(
            email="super_admin@example.com",
            hashed_password="hash",
            role=UserRole.ADMIN,
            is_active=True,
        )
        user = User(
            email="managed_user@example.com",
            hashed_password="hash",
            role=UserRole.USER,
            is_active=True,
            is_trial_registered=True,
        )
        session.add_all([admin, user])
        await session.commit()
        await session.refresh(admin)
        await session.refresh(user)
        admin_id = admin.id
        user_id = user.id

    admin_token = create_access_token(user_id=admin_id, email="super_admin@example.com", role="ADMIN")
    user_token = create_access_token(user_id=user_id, email="managed_user@example.com")

    # 1. User starts trial
    client.post(
        "/api/v1/entitlements/check",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"product_code": "revitapp", "hardware_fingerprint": fp},
    )

    async with TestSessionLocal() as session:
        trial = (await session.execute(select(DeviceTrial).where(DeviceTrial.fingerprint_hash == fp))).scalar_one()
        trial_id = trial.id

    # 2. Admin revokes trial
    rev_resp = client.post(
        f"/api/v1/admin/device-trials/{trial_id}/revoke",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert rev_resp.status_code == 200
    assert rev_resp.json()["status"] == "BLOCKED"

    # User is now blocked on this device
    blocked_check = client.post(
        "/api/v1/entitlements/check",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"product_code": "revitapp", "hardware_fingerprint": fp},
    )
    assert blocked_check.json()["allowed"] is False
    assert blocked_check.json()["error"] == "device_revoked"

    # 3. Admin re-grants trial for 14 days
    grant_resp = client.post(
        f"/api/v1/admin/device-trials/{trial_id}/grant",
        headers={"Authorization": f"Bearer {admin_token}"},
        params={"days": 14},
    )
    assert grant_resp.status_code == 200
    assert grant_resp.json()["status"] == "ok"

    # User can now access again!
    unblocked_check = client.post(
        "/api/v1/entitlements/check",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"product_code": "revitapp", "hardware_fingerprint": fp},
    )
    assert unblocked_check.json()["allowed"] is True
    assert len(unblocked_check.json()["features"]) == 13
    assert unblocked_check.json()["signedLicenseToken"] is not None
