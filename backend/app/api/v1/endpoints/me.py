from datetime import datetime, timezone
from typing import Annotated, Any
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import get_current_user_flexible
from app.db.session import get_async_session
from app.models.device import Device
from app.models.license import License, LicenseStatus
from app.models.user import User
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/me", tags=["me"])


@router.get("")
async def get_me(
    current_user: Annotated[User, Depends(get_current_user_flexible)],
) -> dict[str, Any]:
    """
    Returns current authenticated user profile.
    """
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "name": current_user.name,
        "displayName": current_user.display_name,
        "phone": current_user.phone,
        "jobTitle": current_user.job_title,
        "revitVersion": current_user.revit_version,
        "useCase": current_user.use_case,
        "isTrialRegistered": current_user.is_trial_registered,
        "trialRegisteredAt": current_user.trial_registered_at.isoformat() if current_user.trial_registered_at else None,
        "role": current_user.role.value,
        "status": current_user.status.value,
        "createdAt": current_user.created_at.isoformat() if current_user.created_at else None,
    }


@router.get("/licenses")
async def get_my_licenses(
    current_user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> list[dict[str, Any]]:
    """
    Returns all licenses belonging to the current user.
    """
    res = await db.execute(
        select(License)
        .options(selectinload(License.features), selectinload(License.devices), selectinload(License.plan))
        .where(License.user_id == current_user.id)
    )
    licenses = res.scalars().all()
    output = []
    for lic in licenses:
        output.append({
            "id": str(lic.id),
            "licenseKey": lic.license_key,
            "plan": lic.plan_name,
            "status": lic.status.value,
            "maxDevices": lic.max_devices,
            "startsAt": lic.starts_at.isoformat() if lic.starts_at else None,
            "expiresAt": lic.expires_at.isoformat() if lic.expires_at else None,
            "features": [f.feature_code for f in lic.features],
            "activeDevices": [
                {
                    "id": str(d.id),
                    "installationId": d.installation_id,
                    "displayName": d.display_name,
                    "platform": d.platform,
                    "revitVersion": d.revit_version,
                    "appVersion": d.app_version,
                    "lastSeenAt": d.last_seen_at.isoformat(),
                }
                for d in lic.devices
                if d.revoked_at is None
            ],
            "createdAt": lic.created_at.isoformat(),
        })
    return output


@router.get("/devices")
async def get_my_devices(
    current_user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> list[dict[str, Any]]:
    """
    Returns all active devices across the user's licenses.
    """
    res = await db.execute(
        select(Device)
        .join(License)
        .where(License.user_id == current_user.id, Device.revoked_at.is_(None))
    )
    devices = res.scalars().all()
    return [
        {
            "id": str(d.id),
            "licenseId": str(d.license_id),
            "installationId": d.installation_id,
            "displayName": d.display_name,
            "platform": d.platform,
            "revitVersion": d.revit_version,
            "appVersion": d.app_version,
            "firstSeenAt": d.first_seen_at.isoformat(),
            "lastSeenAt": d.last_seen_at.isoformat(),
        }
        for d in devices
    ]


@router.delete("/devices/{deviceId}")
async def revoke_my_device(
    deviceId: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> dict[str, str]:
    """
    Allows a user to revoke / unbind one of their registered devices.
    """
    res = await db.execute(
        select(Device)
        .join(License)
        .where(Device.id == deviceId, License.user_id == current_user.id)
    )
    device = res.scalar_one_or_none()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

    device.revoked_at = datetime.now(timezone.utc)
    await db.commit()

    await log_audit_event(
        session=db,
        action="user_device_revoked",
        target_type="device",
        target_id=str(device.id),
        actor_user_id=current_user.id,
    )

    return {"status": "ok", "message": "Thiết bị đã được gỡ thành công"}
