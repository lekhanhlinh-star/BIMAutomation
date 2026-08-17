from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.schemas.license import (
    LicenseActivateRequest,
    LicenseActivateResponse,
    LicenseVerifyRequest,
    LicenseVerifyResponse,
)
from app.services import license_service

router = APIRouter(prefix="/licenses", tags=["licenses"])


@router.post("/activate", response_model=LicenseActivateResponse)
async def activate_license(
    payload: LicenseActivateRequest,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> LicenseActivateResponse:
    return await license_service.activate_license(db, payload)


@router.post("/verify", response_model=LicenseVerifyResponse)
async def verify_license(
    payload: LicenseVerifyRequest,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> LicenseVerifyResponse:
    return await license_service.verify_license(db, payload)
