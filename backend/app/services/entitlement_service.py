from datetime import datetime, timedelta, timezone
from typing import Any
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

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
    "standard": [
        "utility-tools",
        "model-from-cad",
        "dwg-export",
        "beam-rebar",
        "column-rebar",
        "footing-rebar",
        "wall-rebar",
        "chat-ai",
        "mcp-read",
    ],
    "monthly": [
        "utility-tools",
        "model-from-cad",
        "dwg-export",
        "beam-rebar",
        "column-rebar",
        "footing-rebar",
        "wall-rebar",
        "chat-ai",
        "mcp-read",
    ],
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
) -> dict[str, Any]:
    """
    Computes entitlement response for Revit client.
    Handles Paid License, Active Device Trial, Auto-granting 14-day trial, or rejection with error code.
    """
    now = datetime.now(timezone.utc)

    # 1. Check user status
    if not user.is_active:
        return {
            "allowed": False,
            "error": "user_inactive",
            "message": "Tài khoản người dùng hiện đang bị vô hiệu hóa",
            "serverTime": now.isoformat(),
        }

    # 2. Check Paid License
    active_license = await get_user_active_license(session, user.id, product_code)
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
        }

    # 3. Check Device Trial via fingerprint_hash
    if fingerprint_hash:
        trial_res = await session.execute(
            select(DeviceTrial).where(DeviceTrial.fingerprint_hash == fingerprint_hash)
        )
        trial = trial_res.scalar_one_or_none()

        if trial:
            # Device has a recorded trial
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

            # Update last active user on this device
            trial.last_user_id = user.id
            await session.commit()

            trial_features = resolve_features("trial", [])
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
            }
        else:
            # First time this device is seen -> Auto-grant 14-day trial if user is trial registered
            if not user.is_trial_registered:
                return {
                    "allowed": False,
                    "error": "trial_registration_required",
                    "message": "Vui lòng hoàn tất biểu mẫu đăng ký dùng thử để kích hoạt 14 ngày trải nghiệm cho thiết bị.",
                    "serverTime": now.isoformat(),
                }

            # Create 14-day device trial record
            expires_at = now + timedelta(days=14)
            new_trial = DeviceTrial(
                fingerprint_hash=fingerprint_hash,
                display_name=display_name or "Revit Workstation",
                platform="windows",
                revit_version=revit_version or user.revit_version or "2025",
                app_version="1.0.0",
                first_trial_at=now,
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
                    "fingerprint_hash": fingerprint_hash,
                    "display_name": new_trial.display_name,
                    "revit_version": new_trial.revit_version,
                },
            )
            await session.commit()

            trial_features = resolve_features("trial", [])
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
            }

    # 4. No License & No fingerprint provided
    return {
        "allowed": False,
        "error": "fingerprint_required",
        "message": "Vui lòng cung cấp Hardware Fingerprint của thiết bị để kiểm tra bản quyền hoặc dùng thử.",
        "serverTime": now.isoformat(),
    }
