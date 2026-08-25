from datetime import datetime, timezone
from typing import Any
import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.device import Device
from app.models.device_trial import DeviceTrial, DeviceTrialStatus
from app.models.license import License, LicenseStatus
from app.models.user import User
from app.services.audit_service import log_audit_event
from app.services.entitlement_service import get_user_active_license
from app.services.trial_service import check_or_create_device_trial, ensure_utc


async def activate_device(
    session: AsyncSession,
    user: User,
    product_code: str,
    installation_id: str,
    fingerprint_hash: str,
    display_name: str = "Desktop Device",
    platform: str = "windows",
    revit_version: str = "",
    app_version: str = "",
) -> dict[str, Any]:
    """
    Activates a desktop device for a user.
    - If user has active Paid License: Binds to license (concurrency-safe, max_devices enforced, idempotent for same installation_id).
    - If no Paid License: keeps one account trial clock and one immutable trial history per machine.
    """
    now = datetime.now(timezone.utc)
    clean_fp = fingerprint_hash.strip().lower()

    # 1. Check Paid License
    active_license = await get_user_active_license(session, user.id, product_code)

    if active_license:
        # Check existing device with same installation_id for this license
        dev_res = await session.execute(
            select(Device).where(
                Device.license_id == active_license.id,
                Device.installation_id == installation_id,
            )
        )
        existing_device = dev_res.scalar_one_or_none()

        if existing_device:
            # Idempotent reactivation on same installation
            existing_device.fingerprint_hash = clean_fp
            existing_device.display_name = display_name or existing_device.display_name
            existing_device.platform = platform or existing_device.platform
            existing_device.revit_version = revit_version or existing_device.revit_version
            existing_device.app_version = app_version or existing_device.app_version
            existing_device.last_seen_at = now
            existing_device.revoked_at = None
            user.active_device_fingerprint = clean_fp
            user.active_device_name = display_name or existing_device.display_name
            user.active_device_last_seen = now
            await session.commit()
            await session.refresh(existing_device)

            await log_audit_event(
                session=session,
                action="device_reactivated",
                target_type="device",
                target_id=str(existing_device.id),
                actor_user_id=user.id,
                metadata={"installation_id": installation_id, "license_id": str(active_license.id)},
            )

            return {
                "success": True,
                "isTrial": False,
                "deviceId": str(existing_device.id),
                "licenseId": str(active_license.id),
                "plan": active_license.plan_name,
                "message": "Thiết bị kích hoạt lại thành công",
            }

        # Check active device count
        count_res = await session.execute(
            select(func.count(Device.id)).where(
                Device.license_id == active_license.id,
                Device.revoked_at.is_(None),
            )
        )
        active_count = count_res.scalar_one()

        if active_count >= active_license.max_devices:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="device_limit",
            )

        # Create new device
        new_device = Device(
            license_id=active_license.id,
            installation_id=installation_id,
            fingerprint_hash=clean_fp,
            display_name=display_name,
            platform=platform,
            revit_version=revit_version,
            app_version=app_version,
            first_seen_at=now,
            last_seen_at=now,
        )
        session.add(new_device)

        # Set as active device for user
        user.active_device_fingerprint = clean_fp
        user.active_device_name = display_name or "Desktop Device"
        user.active_device_last_seen = now

        await session.commit()
        await session.refresh(new_device)

        await log_audit_event(
            session=session,
            action="device_activated",
            target_type="device",
            target_id=str(new_device.id),
            actor_user_id=user.id,
            metadata={"installation_id": installation_id, "license_id": str(active_license.id)},
        )

        return {
            "success": True,
            "isTrial": False,
            "deviceId": str(new_device.id),
            "licenseId": str(active_license.id),
            "plan": active_license.plan_name,
            "message": "Kích hoạt thiết bị thành công",
        }

    # 2. No Paid License: Check & Enforce Device Trial Policy
    is_allowed, trial, error_code, remaining_seconds = await check_or_create_device_trial(
        session=session,
        fingerprint_hash=clean_fp,
        user=user,
        display_name=display_name,
        platform=platform,
        revit_version=revit_version,
        app_version=app_version,
    )

    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=error_code,
        )

    assert trial is not None

    # Set as active device for user
    user.active_device_fingerprint = clean_fp
    user.active_device_name = display_name or "Desktop Device"
    user.active_device_last_seen = now
    await session.commit()

    await log_audit_event(
        session=session,
        action="device_trial_active",
        target_type="device_trial",
        target_id=str(trial.id),
        actor_user_id=user.id,
        metadata={"fingerprint_hash": clean_fp, "remaining_seconds": remaining_seconds},
    )

    return {
        "success": True,
        "isTrial": True,
        "deviceId": str(trial.id),
        "licenseId": None,
        "plan": "trial",
        "expiresAt": min(
            ensure_utc(trial.trial_expires_at),
            ensure_utc(user.trial_expires_at),
        ).isoformat(),
        "remainingSeconds": remaining_seconds,
        "message": f"Kích hoạt phiên dùng thử thành công ({int(remaining_seconds / 86400)} ngày còn lại)",
    }


async def heartbeat_device(
    session: AsyncSession,
    user: User,
    device_id: uuid.UUID | None = None,
    installation_id: str | None = None,
    fingerprint_hash: str | None = None,
) -> dict[str, Any]:
    """
    Heartbeat ping from Revit Add-in. Validates active device concurrency and updates last_seen_at.
    """
    now = datetime.now(timezone.utc)

    # Validate active device concurrency
    clean_hb_fp = (fingerprint_hash or "").strip().lower() or None
    if not clean_hb_fp:
        return {
            "status": "invalid_request",
            "allowed": False,
            "error": "fingerprint_required",
            "message": "Heartbeat phải kèm mã nhận dạng thiết bị.",
            "lastSeenAt": now.isoformat(),
        }

    if user.active_device_fingerprint and user.active_device_fingerprint.lower() != clean_hb_fp:
        other_name = user.active_device_name or "thiết bị khác"
        return {
            "status": "conflict",
            "allowed": False,
            "error": "concurrent_session_conflict",
            "message": f"Tài khoản của bạn đã chuyển sang hoạt động trên thiết bị '{other_name}'. Phiên làm việc trên máy này đã tạm ngắt.",
            "lastSeenAt": now.isoformat(),
        }

    user.active_device_fingerprint = clean_hb_fp
    user.active_device_last_seen = now

    trial_res = await session.execute(
        select(DeviceTrial).where(DeviceTrial.fingerprint_hash == clean_hb_fp)
    )
    trial = trial_res.scalar_one_or_none()
    if trial:
        trial.updated_at = now
        await session.commit()
        return {"status": "ok", "allowed": True, "lastSeenAt": now.isoformat()}

    if device_id:
        dev_res = await session.execute(select(Device).where(Device.id == device_id))
        dev = dev_res.scalar_one_or_none()
        if dev:
            dev.last_seen_at = now
            await session.commit()
            return {"status": "ok", "allowed": True, "lastSeenAt": now.isoformat()}

    await session.commit()
    return {"status": "ok", "allowed": True, "lastSeenAt": now.isoformat()}
