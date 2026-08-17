from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.license import License, LicenseStatus
from app.schemas.license import (
    LicenseActivateRequest,
    LicenseActivateResponse,
    LicenseVerifyRequest,
    LicenseVerifyResponse,
)


def ensure_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


async def activate_license(
    session: AsyncSession, payload: LicenseActivateRequest
) -> LicenseActivateResponse:
    result = await session.execute(
        select(License)
        .options(selectinload(License.plan))
        .where(License.license_key == payload.license_key)
    )
    license_obj = result.scalar_one_or_none()

    if not license_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="License key not found",
        )

    # Check revoked or suspended status
    if license_obj.status in (LicenseStatus.REVOKED, LicenseStatus.SUSPENDED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"License is {license_obj.status.value}",
        )

    # Check device binding
    if license_obj.device_id and license_obj.device_id != payload.device_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="License is registered to another device",
        )

    now = datetime.now(timezone.utc)
    expires_at_utc = ensure_utc(license_obj.expires_at)

    # Check if expired
    if expires_at_utc and expires_at_utc < now:
        license_obj.status = LicenseStatus.EXPIRED
        await session.commit()
        return LicenseActivateResponse(
            success=False,
            status=LicenseStatus.EXPIRED,
            expires_at=license_obj.expires_at,
            message="License has expired",
        )

    # First activation or re-activation on same device
    if not license_obj.device_id or license_obj.status == LicenseStatus.PENDING:
        license_obj.device_id = payload.device_id
        license_obj.activated_at = now
        duration_months = license_obj.plan.duration_months if license_obj.plan else 6
        license_obj.expires_at = now + timedelta(days=duration_months * 30)
        license_obj.status = LicenseStatus.ACTIVE

    license_obj.last_checked_at = now
    await session.commit()

    return LicenseActivateResponse(
        success=True,
        status=license_obj.status,
        expires_at=license_obj.expires_at,
        message="License activated successfully",
    )


async def verify_license(
    session: AsyncSession, payload: LicenseVerifyRequest
) -> LicenseVerifyResponse:
    result = await session.execute(
        select(License).where(License.license_key == payload.license_key)
    )
    license_obj = result.scalar_one_or_none()

    if not license_obj or license_obj.device_id != payload.device_id:
        return LicenseVerifyResponse(
            valid=False,
            status=LicenseStatus.SUSPENDED,
            expires_at=None,
        )

    now = datetime.now(timezone.utc)
    expires_at_utc = ensure_utc(license_obj.expires_at)

    # Check expiration
    if expires_at_utc and expires_at_utc < now:
        if license_obj.status != LicenseStatus.EXPIRED:
            license_obj.status = LicenseStatus.EXPIRED
            await session.commit()
        return LicenseVerifyResponse(
            valid=False,
            status=LicenseStatus.EXPIRED,
            expires_at=license_obj.expires_at,
        )

    if license_obj.status == LicenseStatus.ACTIVE:
        license_obj.last_checked_at = now
        await session.commit()
        return LicenseVerifyResponse(
            valid=True,
            status=LicenseStatus.ACTIVE,
            expires_at=license_obj.expires_at,
        )

    return LicenseVerifyResponse(
        valid=False,
        status=license_obj.status,
        expires_at=license_obj.expires_at,
    )

