from datetime import datetime, timedelta, timezone
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.device_trial import DeviceTrial, DeviceTrialStatus
from app.models.user import User

TRIAL_DURATION_DAYS = 14


def ensure_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


async def check_or_create_device_trial(
    session: AsyncSession,
    fingerprint_hash: str,
    user_id: uuid.UUID,
    display_name: str = "Desktop Device",
    platform: str = "windows",
    revit_version: str = "",
    app_version: str = "",
) -> tuple[bool, DeviceTrial, str | None, int]:
    """
    Evaluates or initializes 14-day trial for a machine hardware fingerprint.
    Returns: (is_allowed, trial_record, error_code, remaining_seconds)
    """
    now = datetime.now(timezone.utc)
    result = await session.execute(
        select(DeviceTrial).where(DeviceTrial.fingerprint_hash == fingerprint_hash)
    )
    trial = result.scalar_one_or_none()

    if not trial:
        # First time seen: Create 14-day trial
        expires_at = now + timedelta(days=TRIAL_DURATION_DAYS)
        trial = DeviceTrial(
            fingerprint_hash=fingerprint_hash,
            display_name=display_name,
            platform=platform,
            revit_version=revit_version,
            app_version=app_version,
            first_trial_at=now,
            trial_expires_at=expires_at,
            initial_user_id=user_id,
            last_user_id=user_id,
            status=DeviceTrialStatus.ACTIVE,
        )
        session.add(trial)
        await session.commit()
        await session.refresh(trial)
        remaining_seconds = int((expires_at - now).total_seconds())
        return True, trial, None, remaining_seconds

    # Existing trial record on this machine
    if trial.status == DeviceTrialStatus.BLOCKED:
        return False, trial, "device_blocked", 0

    trial_expires_at_utc = ensure_utc(trial.trial_expires_at)
    if trial_expires_at_utc and trial_expires_at_utc < now:
        if trial.status != DeviceTrialStatus.EXPIRED:
            trial.status = DeviceTrialStatus.EXPIRED
            await session.commit()
        return False, trial, "trial_expired_on_device", 0

    # Still valid within remaining days of the original 14-day window
    trial.last_user_id = user_id
    trial.display_name = display_name or trial.display_name
    trial.revit_version = revit_version or trial.revit_version
    trial.app_version = app_version or trial.app_version
    trial.updated_at = now
    await session.commit()

    remaining_seconds = int((trial_expires_at_utc - now).total_seconds())
    return True, trial, None, remaining_seconds


async def reset_device_trial(
    session: AsyncSession,
    trial_id: uuid.UUID,
    additional_days: int = TRIAL_DURATION_DAYS,
) -> DeviceTrial:
    """
    Admin action to reset or extend a device trial.
    """
    result = await session.execute(
        select(DeviceTrial).where(DeviceTrial.id == trial_id)
    )
    trial = result.scalar_one_or_none()
    if not trial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device trial record not found",
        )

    now = datetime.now(timezone.utc)
    trial.trial_expires_at = now + timedelta(days=additional_days)
    trial.status = DeviceTrialStatus.ACTIVE
    trial.reset_count += 1
    trial.updated_at = now
    await session.commit()
    await session.refresh(trial)
    return trial


async def block_device_trial(
    session: AsyncSession,
    trial_id: uuid.UUID,
) -> DeviceTrial:
    """
    Admin action to block/blacklist a device from trial and usage.
    """
    result = await session.execute(
        select(DeviceTrial).where(DeviceTrial.id == trial_id)
    )
    trial = result.scalar_one_or_none()
    if not trial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device trial record not found",
        )

    trial.status = DeviceTrialStatus.BLOCKED
    trial.updated_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(trial)
    return trial
