from typing import Annotated, Any

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user_flexible
from app.db.session import get_async_session
from app.models.user import User
from app.schemas.desktop_auth import DeviceActivateRequest, DeviceHeartbeatRequest
from app.services import device_service

router = APIRouter(prefix="/devices", tags=["devices"])


@router.post("/activate")
async def activate_device_endpoint(
    payload: DeviceActivateRequest,
    current_user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> dict[str, Any]:
    """
    Activates a Revit desktop device under server-authoritative authentication.
    - If user has active Paid License: associates device up to max_devices limit.
    - If user has no Paid License: evaluates or grants 14-day hardware trial.
    """
    return await device_service.activate_device(
        session=db,
        user=current_user,
        product_code=payload.productCode,
        installation_id=payload.installationId,
        fingerprint_hash=payload.machineFingerprint,
        display_name=payload.displayName,
        platform=payload.platform,
        revit_version=payload.revitVersion,
        app_version=payload.appVersion,
    )


@router.post("/heartbeat")
async def heartbeat_endpoint(
    payload: DeviceHeartbeatRequest,
    current_user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> dict[str, Any]:
    """
    Device heartbeat endpoint to confirm active session and update telemetry.
    """
    import uuid
    dev_id = None
    if payload.deviceId:
        try:
            dev_id = uuid.UUID(payload.deviceId)
        except ValueError:
            pass

    return await device_service.heartbeat_device(
        session=db,
        user=current_user,
        device_id=dev_id,
        installation_id=payload.installationId,
        fingerprint_hash=payload.machineFingerprint,
    )
