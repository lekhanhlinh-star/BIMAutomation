from datetime import datetime, timedelta, timezone
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

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
    user: User,
    display_name: str = "Desktop Device",
    platform: str = "windows",
    revit_version: str = "",
    app_version: str = "",
) -> tuple[bool, DeviceTrial | None, str | None, int]:
    """
    Evaluates or initializes a trial for an account on a physical machine.

    The account owns the 14-day clock and may move between machines. Every
    machine keeps its first (and only) trial window, so changing accounts or
    reinstalling the client never starts that machine's clock again.
    Returns: (is_allowed, trial_record, error_code, remaining_seconds)
    """
    now = datetime.now(timezone.utc)
    clean_fingerprint = fingerprint_hash.strip().lower()
    user_trial_expires_at = ensure_utc(user.trial_expires_at)

    if user_trial_expires_at and user_trial_expires_at <= now:
        # A new machine must never restart an expired account trial.
        return False, None, "trial_expired_for_user", 0

    result = await session.execute(
        select(DeviceTrial).where(DeviceTrial.fingerprint_hash == clean_fingerprint)
    )
    trial = result.scalar_one_or_none()

    if not trial:
        # First time this machine is seen. Reuse the account deadline when the
        # account already started elsewhere; otherwise start both clocks now.
        if user_trial_expires_at is None:
            user.trial_started_at = now
            user.trial_expires_at = now + timedelta(days=TRIAL_DURATION_DAYS)
            user_trial_expires_at = user.trial_expires_at

        expires_at = user_trial_expires_at
        trial = DeviceTrial(
            fingerprint_hash=clean_fingerprint,
            display_name=display_name,
            platform=platform,
            revit_version=revit_version,
            app_version=app_version,
            first_trial_at=now,
            trial_expires_at=expires_at,
            initial_user_id=user.id,
            last_user_id=user.id,
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
    # A fresh account using a previously seen machine gets its own account
    # clock, while the machine retains its original one-time deadline.
    if user_trial_expires_at is None:
        user.trial_started_at = now
        user.trial_expires_at = now + timedelta(days=TRIAL_DURATION_DAYS)
        user_trial_expires_at = user.trial_expires_at

    effective_expires_at = min(trial_expires_at_utc, user_trial_expires_at)
    trial.last_user_id = user.id
    trial.display_name = display_name or trial.display_name
    trial.revit_version = revit_version or trial.revit_version
    trial.app_version = app_version or trial.app_version
    trial.updated_at = now
    await session.commit()

    remaining_seconds = int((effective_expires_at - now).total_seconds())
    return True, trial, None, remaining_seconds


async def reset_device_trial(
    session: AsyncSession,
    trial_id: uuid.UUID,
    additional_days: int = TRIAL_DURATION_DAYS,
) -> DeviceTrial:
    """
    Clears the active session without changing the machine's one-time window.

    ``additional_days`` remains in the signature for API compatibility but is
    intentionally ignored. A reset must never grant the same machine a second
    trial.
    """
    del additional_days
    result = await session.execute(
        select(DeviceTrial).options(selectinload(DeviceTrial.last_user)).where(DeviceTrial.id == trial_id)
    )
    trial = result.scalar_one_or_none()
    if not trial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device trial record not found",
        )

    now = datetime.now(timezone.utc)
    expires_at = ensure_utc(trial.trial_expires_at)
    if expires_at <= now:
        trial.status = DeviceTrialStatus.EXPIRED
    trial.reset_count += 1
    trial.updated_at = now

    if trial.last_user and trial.last_user.active_device_fingerprint == trial.fingerprint_hash:
        trial.last_user.active_device_fingerprint = None
        trial.last_user.active_device_name = None
        trial.last_user.active_device_last_seen = None

    await session.commit()
    await session.refresh(trial)
    return trial


async def grant_device_trial(
    session: AsyncSession,
    trial_id: uuid.UUID,
    days: int = TRIAL_DURATION_DAYS,
) -> DeviceTrial:
    """
    Unblocks a still-running first trial. It never extends an expired window.
    """
    del days
    result = await session.execute(
        select(DeviceTrial).options(selectinload(DeviceTrial.last_user)).where(DeviceTrial.id == trial_id)
    )
    trial = result.scalar_one_or_none()
    if not trial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device trial record not found",
        )

    now = datetime.now(timezone.utc)
    if ensure_utc(trial.trial_expires_at) <= now:
        trial.status = DeviceTrialStatus.EXPIRED
        await session.commit()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="trial_already_consumed",
        )

    trial.status = DeviceTrialStatus.ACTIVE
    trial.reset_count += 1
    trial.updated_at = now

    if trial.last_user:
        trial.last_user.active_device_fingerprint = trial.fingerprint_hash
        trial.last_user.active_device_name = trial.display_name
        trial.last_user.active_device_last_seen = now

    await session.commit()
    await session.refresh(trial)
    return trial


async def revoke_device_trial(
    session: AsyncSession,
    trial_id: uuid.UUID,
) -> DeviceTrial:
    """
    Admin action to revoke/block a device from trial and terminate active session.
    """
    result = await session.execute(
        select(DeviceTrial).options(selectinload(DeviceTrial.last_user)).where(DeviceTrial.id == trial_id)
    )
    trial = result.scalar_one_or_none()
    if not trial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device trial record not found",
        )

    trial.status = DeviceTrialStatus.BLOCKED
    trial.updated_at = datetime.now(timezone.utc)

    if trial.last_user and trial.last_user.active_device_fingerprint == trial.fingerprint_hash:
        trial.last_user.active_device_fingerprint = None

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
    return await revoke_device_trial(session, trial_id)


async def set_active_device_trial(
    session: AsyncSession,
    trial_id: uuid.UUID,
) -> DeviceTrial:
    """
    Admin action to set this machine as the currently active device for its user.
    """
    result = await session.execute(
        select(DeviceTrial).options(selectinload(DeviceTrial.last_user)).where(DeviceTrial.id == trial_id)
    )
    trial = result.scalar_one_or_none()
    if not trial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device trial record not found",
        )

    now = datetime.now(timezone.utc)
    if trial.status != DeviceTrialStatus.ACTIVE or ensure_utc(trial.trial_expires_at) <= now:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="trial_already_consumed",
        )

    if trial.last_user:
        trial.last_user.active_device_fingerprint = trial.fingerprint_hash
        trial.last_user.active_device_name = trial.display_name
        trial.last_user.active_device_last_seen = now

    await session.commit()
    await session.refresh(trial)
    return trial


async def delete_device_trial(
    session: AsyncSession,
    trial_id: uuid.UUID,
) -> bool:
    """
    Tombstones a trial record so its hardware history cannot be erased.
    """
    result = await session.execute(
        select(DeviceTrial).options(selectinload(DeviceTrial.last_user)).where(DeviceTrial.id == trial_id)
    )
    trial = result.scalar_one_or_none()
    if not trial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device trial record not found",
        )

    if trial.last_user and trial.last_user.active_device_fingerprint == trial.fingerprint_hash:
        trial.last_user.active_device_fingerprint = None

    trial.status = DeviceTrialStatus.BLOCKED
    trial.updated_at = datetime.now(timezone.utc)
    await session.commit()
    return True
