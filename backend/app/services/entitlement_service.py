from datetime import datetime, timedelta, timezone
from typing import Any
import uuid

from sqlalchemy import or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.license_crypto import sign_license_token, verify_payload_hmac
from app.models.device import Device
from app.models.device_trial import DeviceTrial, DeviceTrialStatus
from app.models.license import License, LicenseStatus
from app.models.license_feature import LicenseFeature
from app.models.product import Product
from app.models.user import User
from app.services.audit_service import log_audit_event

ALL_FEATURES = [
    "utility-tools",
    "model-from-cad",
    "dwg-export",
    "beam-rebar",
    "column-rebar",
    "footing-rebar",
    "wall-rebar",
    "beam-drawing",
    "footing-drawing",
    "point-cloud",
    "chat-ai",
    "mcp-read",
    "mcp-write",
]

DEFAULT_PLAN_FEATURES: dict[str, list[str]] = {
    "trial": ALL_FEATURES,
    "14-day free trial": ALL_FEATURES,
    "standard": ALL_FEATURES,
    "monthly": ALL_FEATURES,
    "pro": ALL_FEATURES,
    "annual": ALL_FEATURES,
    "professional": ALL_FEATURES,
    "enterprise": ALL_FEATURES,
}


def resolve_features(plan_name: str, custom_features: list[str]) -> list[str]:
    """
    Computes distinct list of features based on plan tier and custom license features.
    """
    plan_key = plan_name.lower().strip()
    matched_features = []
    for key, features in DEFAULT_PLAN_FEATURES.items():
        if key in plan_key:
            matched_features = features
            break
    if not matched_features:
        matched_features = DEFAULT_PLAN_FEATURES["standard"]

    all_set = set(matched_features).union(set(custom_features))
    # Preserve standard ordering
    return [f for f in ALL_FEATURES if f in all_set]


async def get_user_active_license(
    session: AsyncSession,
    user_id: uuid.UUID,
    product_code: str = "revitapp",
) -> License | None:
    """
    Retrieves active, non-expired paid license for user.
    """
    now = datetime.now(timezone.utc)

    # Auto-activate any legacy PENDING licenses
    pending_res = await session.execute(
        select(License)
        .options(selectinload(License.features), selectinload(License.devices), selectinload(License.plan))
        .where(
            License.user_id == user_id,
            License.status == LicenseStatus.PENDING,
            License.revoked_at.is_(None),
        )
    )
    pending_lics = pending_res.scalars().all()
    if pending_lics:
        for lic in pending_lics:
            duration_months = lic.plan.duration_months if lic.plan else 1
            duration_days = 365 if duration_months >= 12 else (duration_months * 30 if duration_months else 30)
            start_time = lic.created_at or now
            if start_time.tzinfo is None:
                start_time = start_time.replace(tzinfo=timezone.utc)
            lic.status = LicenseStatus.ACTIVE
            lic.starts_at = start_time
            lic.activated_at = start_time
            lic.expires_at = start_time + timedelta(days=duration_days)
            if lic.plan and not lic.plan_name:
                lic.plan_name = lic.plan.name
        await session.commit()

    result = await session.execute(
        select(License)
        .options(selectinload(License.features), selectinload(License.devices), selectinload(License.plan))
        .where(
            License.user_id == user_id,
            License.status == LicenseStatus.ACTIVE,
            License.revoked_at.is_(None),
        )
    )
    licenses = result.scalars().all()
    for lic in licenses:
        exp = lic.expires_at
        if exp and exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp is None or exp > now:
            return lic
    return None


async def get_entitlement_for_user_and_device(
    session: AsyncSession,
    user: User,
    product_code: str = "revitapp",
    device_id: uuid.UUID | None = None,
    installation_id: str | None = None,
    fingerprint_hash: str | None = None,
    revit_version: str | None = None,
    display_name: str | None = None,
    takeover: bool = False,
    is_periodic: bool = False,
    bios_uuid: str | None = None,
    cpu_id: str | None = None,
    motherboard_serial: str | None = None,
    disk_serial: str | None = None,
    mac_address: str | None = None,
    machine_guid: str | None = None,
    processor_id: str | None = None,
    baseboard_serial: str | None = None,
    is_virtual_machine: bool | None = None,
    virtual_machine_hint: str | None = None,
    request_timestamp: int | None = None,
    request_signature: str | None = None,
    app_version: str | None = None,
) -> dict[str, Any]:
    """
    Computes entitlement response for Revit client.
    Enforces Multi-Factor Anti-Abuse Hardware Matching (BIOS, Mainboard, Disk, CPU).
    Enforces Single Active Device Concurrency (1 account = 1 active device at a time).
    Handles Paid License (72h grace period), Active Device Trial (12h grace period),
    Auto-granting 14-day trial, or rejection with error code.
    """
    now = datetime.now(timezone.utc)

    # Resolve aliases
    resolved_cpu = cpu_id if cpu_id is not None else processor_id
    resolved_mb = motherboard_serial if motherboard_serial is not None else baseboard_serial

    # 1. Verify HMAC Signature and Request Timestamp Skew (Anti-Tampering & Anti-Replay)
    if request_signature is not None or request_timestamp is not None:
        if not request_signature or request_timestamp is None:
            return {
                "allowed": False,
                "error": "invalid_signature",
                "message": "Dữ liệu xác thực không hợp lệ. Vui lòng cài lại BIMAutomation từ trang chính thức.",
                "serverTime": now.isoformat(),
            }
        valid_sig, sig_err = verify_payload_hmac(
            signature=request_signature,
            timestamp=request_timestamp,
            bios_uuid=bios_uuid,
            cpu_id=resolved_cpu,
            motherboard_serial=resolved_mb,
            disk_serial=disk_serial,
            mac_address=mac_address,
            machine_guid=machine_guid,
        )
        if not valid_sig:
            return {
                "allowed": False,
                "error": "invalid_signature",
                "message": f"Chữ ký xác thực gói tin không hợp lệ hoặc đã quá hạn: {sig_err}",
                "serverTime": now.isoformat(),
            }

    # 2. Check user status
    if not user.is_active:
        return {
            "allowed": False,
            "error": "user_inactive",
            "message": "Tài khoản người dùng hiện đang bị vô hiệu hóa",
            "serverTime": now.isoformat(),
        }

    # Normalize hardware components for matching
    clean_bios = (bios_uuid or "").strip().lower() or None
    clean_mb = (resolved_mb or "").strip().lower() or None
    clean_disk = (disk_serial or "").strip().lower() or None
    clean_cpu = (resolved_cpu or "").strip().lower() or None
    clean_mac = (mac_address or "").strip().lower() or None
    clean_fp = (fingerprint_hash or "").strip().lower() or None

    effective_fp = clean_fp or clean_bios or clean_mb or clean_disk
    active_license = await get_user_active_license(session, user.id, product_code)

    # Reject ineligible trial requests before they can claim the active-device slot.
    request_is_vm = bool(is_virtual_machine)
    vm_keywords = ["vmware", "virtualbox", "qemu", "hyper-v", "parallels", "xen", "kvm", "virtual machine"]
    for val in [
        clean_bios,
        clean_mb,
        (display_name or "").lower(),
        (clean_fp or "").lower(),
        (virtual_machine_hint or "").lower(),
    ]:
        if val and any(keyword in val for keyword in vm_keywords):
            request_is_vm = True
            break

    user_trial_exp = user.trial_expires_at
    if user_trial_exp and user_trial_exp.tzinfo is None:
        user_trial_exp = user_trial_exp.replace(tzinfo=timezone.utc)

    if not active_license and request_is_vm:
        return {
            "allowed": False,
            "error": "virtual_machine_not_allowed",
            "message": "Không cấp dùng thử trên máy ảo. Vui lòng dùng máy thật hoặc mua license.",
            "serverTime": now.isoformat(),
        }

    if not active_license and user_trial_exp and user_trial_exp < now:
        return {
            "allowed": False,
            "error": "trial_expired_for_user",
            "message": "Tài khoản của bạn đã hết 14 ngày dùng thử. Vui lòng nâng cấp bản quyền để tiếp tục sử dụng.",
            "serverTime": now.isoformat(),
        }

    # 3. Enforce Single Active Device Concurrency
    if effective_fp:
        if user.active_device_fingerprint is None:
            # Atomically claim the first active-device slot. This prevents two
            # simultaneous first requests from both being accepted.
            await session.execute(
                update(User)
                .where(
                    User.id == user.id,
                    User.active_device_fingerprint.is_(None),
                )
                .values(
                    active_device_fingerprint=effective_fp,
                    active_device_name=display_name or "Revit Workstation",
                    active_device_last_seen=now,
                )
            )
            await session.commit()
            await session.refresh(user)

        active_fp = (user.active_device_fingerprint or "").strip().lower()
        if active_fp == effective_fp:
            # Same device: refresh last seen & name
            user.active_device_last_seen = now
            if display_name:
                user.active_device_name = display_name
            await session.commit()
        else:
            # Account active on another machine
            if takeover and not is_periodic:
                prev_name = user.active_device_name or "máy khác"
                prev_fp = user.active_device_fingerprint
                user.active_device_fingerprint = effective_fp
                user.active_device_name = display_name or "Revit Workstation"
                user.active_device_last_seen = now

                await log_audit_event(
                    session=session,
                    action="device_session_takeover",
                    target_type="user",
                    target_id=str(user.id),
                    actor_user_id=user.id,
                    metadata={
                        "previous_fingerprint": prev_fp,
                        "previous_device_name": prev_name,
                        "new_fingerprint": effective_fp,
                        "new_device_name": user.active_device_name,
                    },
                )
                await session.commit()
            else:
                other_name = user.active_device_name or "thiết bị khác"
                return {
                    "allowed": False,
                    "error": "concurrent_session_conflict",
                    "message": f"Tài khoản của bạn đã chuyển sang hoạt động trên thiết bị '{other_name}'. Phiên làm việc trên máy này đã tạm ngắt.",
                    "serverTime": now.isoformat(),
                }

    # 4. Check Paid License
    if active_license:
        # Check device if provided
        matched_device = None
        if device_id:
            for dev in active_license.devices:
                if dev.id == device_id and dev.revoked_at is None:
                    matched_device = dev
                    break
        elif installation_id:
            for dev in active_license.devices:
                if dev.installation_id == installation_id and dev.revoked_at is None:
                    matched_device = dev
                    break

        custom_features = [f.feature_code for f in active_license.features]
        features = resolve_features(active_license.plan_name, custom_features)

        exp = active_license.expires_at
        if exp and exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)

        signed_token = sign_license_token(
            user_id=user.id,
            email=user.email or "unknown",
            hwid=effective_fp or "hwid_none",
            product_code=product_code,
            plan_name=active_license.plan_name,
            is_trial=False,
            features=features,
            expires_at=exp,
            grace_period_hours=72,
        )

        return {
            "allowed": True,
            "product": product_code,
            "licenseId": str(active_license.id),
            "deviceId": str(matched_device.id) if matched_device else (str(device_id) if device_id else None),
            "plan": active_license.plan_name,
            "isTrial": False,
            "expiresAt": exp.isoformat() if exp else None,
            "features": features,
            "serverTime": now.isoformat(),
            "refreshAfterSeconds": 300,
            "signedLicenseToken": signed_token,
            "gracePeriodHours": 72,
            "grace_period_hours": 72,
            "trialQuota": None,
        }

    # 5. Check Device & User Trial via Multi-Attribute Anti-Abuse Lock
    if effective_fp:
        # Check if user's personal trial quota has already expired
        if user_trial_exp and user_trial_exp < now:
            return {
                "allowed": False,
                "error": "trial_expired_for_user",
                "message": "Tài khoản của bạn đã hết 14 ngày dùng thử. Vui lòng nâng cấp bản quyền để tiếp tục sử dụng.",
                "serverTime": now.isoformat(),
            }

        # Multi-factor hardware component matching to prevent trial resetting via new accounts or registry tampering
        hw_conditions = []
        if clean_fp:
            hw_conditions.append(DeviceTrial.fingerprint_hash == clean_fp)
        if clean_bios and clean_bios not in ("unknown", "00000000-0000-0000-0000-000000000000", "none"):
            hw_conditions.append(DeviceTrial.bios_uuid == clean_bios)
        if clean_mb and clean_mb not in ("unknown", "to be filled by o.e.m.", "none", "default string", "base board serial number"):
            hw_conditions.append(DeviceTrial.motherboard_serial == clean_mb)
        if clean_disk and clean_disk not in ("unknown", "none", "0"):
            hw_conditions.append(DeviceTrial.disk_serial == clean_disk)

        trial = None
        if hw_conditions:
            trial_res = await session.execute(
                select(DeviceTrial).where(or_(*hw_conditions))
            )
            trial = trial_res.scalars().first()

        if trial:
            # Device has a recorded trial on at least one physical component
            if trial.status == DeviceTrialStatus.BLOCKED:
                return {
                    "allowed": False,
                    "error": "device_revoked",
                    "message": "Thiết bị này đã bị khóa dùng thử trên hệ thống",
                    "serverTime": now.isoformat(),
                }
            exp_trial = trial.trial_expires_at
            if exp_trial and exp_trial.tzinfo is None:
                exp_trial = exp_trial.replace(tzinfo=timezone.utc)

            if exp_trial and exp_trial < now:
                return {
                    "allowed": False,
                    "error": "trial_expired_on_device",
                    "message": "Thiết bị này đã hết 14 ngày dùng thử. Vui lòng nâng cấp bản quyền để tiếp tục sử dụng.",
                    "serverTime": now.isoformat(),
                }

            # Update last active user on this device & sync missing hardware attributes
            trial.last_user_id = user.id
            if not trial.bios_uuid and clean_bios:
                trial.bios_uuid = clean_bios
            if not trial.motherboard_serial and clean_mb:
                trial.motherboard_serial = clean_mb
            if not trial.disk_serial and clean_disk:
                trial.disk_serial = clean_disk
            if not trial.cpu_id and clean_cpu:
                trial.cpu_id = clean_cpu
            if not trial.mac_address and clean_mac:
                trial.mac_address = clean_mac

            # If user had no recorded trial started, bind user trial to this device trial expiry
            if user.trial_started_at is None:
                user.trial_started_at = trial.first_trial_at or now
                user.trial_expires_at = exp_trial
            elif user_trial_exp and user_trial_exp < (exp_trial or now):
                # If user trial expires sooner than device trial, take the minimum
                exp_trial = user_trial_exp

            await session.commit()

            trial_features = resolve_features("trial", [])
            signed_token = sign_license_token(
                user_id=user.id,
                email=user.email or "unknown",
                hwid=effective_fp,
                product_code=product_code,
                plan_name="14-Day Free Trial",
                is_trial=True,
                features=trial_features,
                expires_at=exp_trial,
                grace_period_hours=12,
            )

            return {
                "allowed": True,
                "product": product_code,
                "licenseId": None,
                "deviceId": str(trial.id),
                "plan": "14-Day Free Trial",
                "isTrial": True,
                "expiresAt": exp_trial.isoformat() if exp_trial else None,
                "features": trial_features,
                "serverTime": now.isoformat(),
                "refreshAfterSeconds": 300,
                "signedLicenseToken": signed_token,
                "gracePeriodHours": 12,
                "grace_period_hours": 12,
                "trialQuota": None,
            }
        else:
            # First time this physical device is seen -> Check user trial status
            if not user.is_trial_registered:
                return {
                    "allowed": False,
                    "error": "trial_registration_required",
                    "message": "Vui lòng hoàn tất biểu mẫu đăng ký dùng thử để kích hoạt 14 ngày trải nghiệm cho thiết bị.",
                    "serverTime": now.isoformat(),
                }

            # If user already started trial previously on another device, carry over remaining time
            if user_trial_exp:
                if user_trial_exp < now:
                    return {
                        "allowed": False,
                        "error": "trial_expired_for_user",
                        "message": "Tài khoản của bạn đã hết 14 ngày dùng thử. Vui lòng nâng cấp bản quyền để tiếp tục sử dụng.",
                        "serverTime": now.isoformat(),
                    }
                expires_at = user_trial_exp
            else:
                # Fresh 14-day trial for user & device
                expires_at = now + timedelta(days=14)
                user.trial_started_at = now
                user.trial_expires_at = expires_at

            new_trial = DeviceTrial(
                fingerprint_hash=clean_fp or f"fp_{uuid.uuid4().hex[:16]}",
                bios_uuid=clean_bios,
                cpu_id=clean_cpu,
                motherboard_serial=clean_mb,
                disk_serial=clean_disk,
                mac_address=clean_mac,
                display_name=display_name or "Revit Workstation",
                platform="windows",
                revit_version=revit_version or user.revit_version or "2025",
                app_version=app_version or "1.0.0",
                first_trial_at=user.trial_started_at or now,
                trial_expires_at=expires_at,
                initial_user_id=user.id,
                last_user_id=user.id,
                status=DeviceTrialStatus.ACTIVE,
            )
            session.add(new_trial)
            await session.commit()
            await session.refresh(new_trial)

            await log_audit_event(
                session=session,
                action="device_trial_started",
                target_type="device_trial",
                target_id=str(new_trial.id),
                actor_user_id=user.id,
                metadata={
                    "fingerprint_hash": clean_fp,
                    "bios_uuid": clean_bios,
                    "motherboard_serial": clean_mb,
                    "disk_serial": clean_disk,
                    "display_name": new_trial.display_name,
                    "revit_version": new_trial.revit_version,
                },
            )
            await session.commit()

            trial_features = resolve_features("trial", [])
            signed_token = sign_license_token(
                user_id=user.id,
                email=user.email or "unknown",
                hwid=effective_fp,
                product_code=product_code,
                plan_name="14-Day Free Trial",
                is_trial=True,
                features=trial_features,
                expires_at=expires_at,
                grace_period_hours=12,
            )

            return {
                "allowed": True,
                "product": product_code,
                "licenseId": None,
                "deviceId": str(new_trial.id),
                "plan": "14-Day Free Trial",
                "isTrial": True,
                "expiresAt": expires_at.isoformat(),
                "features": trial_features,
                "serverTime": now.isoformat(),
                "refreshAfterSeconds": 300,
                "signedLicenseToken": signed_token,
                "gracePeriodHours": 12,
                "grace_period_hours": 12,
                "trialQuota": None,
            }

    # 6. No License & No fingerprint/hardware telemetry provided
    return {
        "allowed": False,
        "error": "fingerprint_required",
        "message": "Vui lòng cung cấp thông số phần cứng của thiết bị để kiểm tra bản quyền hoặc dùng thử.",
        "serverTime": now.isoformat(),
    }
