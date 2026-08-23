from typing import Annotated, Any
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user_flexible
from app.db.session import get_async_session
from app.models.user import User
from app.schemas.desktop_auth import EntitlementResponse, LicenseCheckRequest
from app.services import entitlement_service

router = APIRouter(prefix="/entitlements", tags=["entitlements"])


@router.post("/check", response_model=EntitlementResponse)
async def check_license_and_trial(
    payload: LicenseCheckRequest,
    current_user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> EntitlementResponse:
    """
    Checks paid license or 14-day device trial for RevitAI client.
    Server-authoritative check with anti-abuse hardware fingerprint binding.
    """
    dev_id = None
    if payload.device_id:
        try:
            dev_id = uuid.UUID(payload.device_id)
        except ValueError:
            pass

    data = await entitlement_service.get_entitlement_for_user_and_device(
        session=db,
        user=current_user,
        product_code=payload.product_code,
        device_id=dev_id,
        installation_id=payload.installation_id,
        fingerprint_hash=payload.hardware_fingerprint,
        revit_version=payload.revit_version,
        display_name=payload.device_name,
        takeover=payload.takeover,
        is_periodic=payload.is_periodic,
    )
    return EntitlementResponse(**data)


@router.get("/{productCode}", response_model=EntitlementResponse)
async def get_product_entitlement(
    productCode: str,
    current_user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[AsyncSession, Depends(get_async_session)],
    deviceId: str | None = Query(None, description="Activated device UUID"),
    installationId: str | None = Query(None, description="Installation UUID"),
    fingerprintHash: str | None = Query(None, description="Hardware fingerprint SHA-256 hash"),
    deviceName: str | None = Query(None, description="Computer name"),
    takeover: bool = Query(True, description="Take over active session on machine switch"),
    isPeriodic: bool = Query(False, description="Whether this is a background heartbeat check"),
) -> EntitlementResponse:
    """
    Computes entitlement status and available features for the requesting user and machine.
    Server-authoritative: returns allowed features, plan, and expiry.
    """
    dev_id = None
    if deviceId:
        try:
            dev_id = uuid.UUID(deviceId)
        except ValueError:
            pass

    data = await entitlement_service.get_entitlement_for_user_and_device(
        session=db,
        user=current_user,
        product_code=productCode,
        device_id=dev_id,
        installation_id=installationId,
        fingerprint_hash=fingerprintHash,
        display_name=deviceName,
        takeover=takeover,
        is_periodic=isPeriodic,
    )
    return EntitlementResponse(**data)
