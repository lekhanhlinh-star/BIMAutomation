import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.license import License
from app.models.order import Order
from app.models.release import Release
from app.services.checkout_service import expire_stale_orders


async def get_customer_licenses(
    session: AsyncSession, user_id: uuid.UUID
) -> list[License]:
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
