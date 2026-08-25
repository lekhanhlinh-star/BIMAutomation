import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from datetime import datetime, timedelta, timezone
from app.models.license import License, LicenseStatus
from app.models.order import Order
from app.models.release import Release
from app.services.checkout_service import expire_stale_orders


async def get_customer_licenses(
    session: AsyncSession, user_id: uuid.UUID
) -> list[License]:
    # Auto-activate any legacy PENDING licenses
    pending_res = await session.execute(
        select(License)
        .options(selectinload(License.plan))
        .where(License.user_id == user_id, License.status == LicenseStatus.PENDING)
    )
    pending_lics = pending_res.scalars().all()
    if pending_lics:
        now = datetime.now(timezone.utc)
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
        .options(selectinload(License.plan))
        .where(License.user_id == user_id)
        .order_by(License.created_at.desc())
    )
    return list(result.scalars().all())


async def get_customer_orders(
    session: AsyncSession, user_id: uuid.UUID
) -> list[Order]:
    await expire_stale_orders(session)

    result = await session.execute(
        select(Order)
        .options(selectinload(Order.plan))
        .where(Order.user_id == user_id)
        .order_by(Order.created_at.desc())
    )
    return list(result.scalars().all())


async def get_latest_release(session: AsyncSession) -> Release | None:
    result = await session.execute(
        select(Release)
        .where(Release.is_active == True)
        .order_by(Release.released_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()
