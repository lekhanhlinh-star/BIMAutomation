from datetime import datetime, timedelta, timezone
import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.license import License, LicenseStatus
from app.models.order import Order, OrderStatus
from app.models.payment import Payment
from app.models.release import Release
from app.models.user import User
from app.schemas.admin import (
    AdminCustomerRead,
    AdminDashboardStats,
    AdminPaymentRead,
    ReleaseCreate,
    RevenueMonthRead,
)
from app.services.checkout_service import expire_stale_orders
from app.services.license_service import ensure_utc


async def get_dashboard_stats(session: AsyncSession) -> AdminDashboardStats:
    await expire_stale_orders(session)

    # 1. Total revenue
    rev_res = await session.execute(
        select(func.coalesce(func.sum(Order.amount), 0)).where(
            Order.status == OrderStatus.PAID
        )
    )
    total_revenue = rev_res.scalar_one()

    # 2. Total users
    users_res = await session.execute(select(func.count(User.id)))
    total_users = users_res.scalar_one()

    # 3. Active licenses count
    lic_res = await session.execute(
        select(func.count(License.id)).where(License.status == LicenseStatus.ACTIVE)
    )
    active_licenses = lic_res.scalar_one()

    # 4. Total orders count
    orders_res = await session.execute(select(func.count(Order.id)))
    total_orders = orders_res.scalar_one()

    # 5. Pending orders count
    pending_res = await session.execute(
        select(func.count(Order.id)).where(Order.status == OrderStatus.PENDING)
    )
    pending_orders = pending_res.scalar_one()

    # 6. Revenue growth vs previous calendar month
    now = datetime.now(timezone.utc)
    this_month_start = now.replace(
        day=1, hour=0, minute=0, second=0, microsecond=0
    )
    last_month_end = this_month_start
    last_month_start = (last_month_end - timedelta(days=1)).replace(day=1)

    this_month_rev_res = await session.execute(
        select(func.coalesce(func.sum(Order.amount), 0)).where(
            Order.status == OrderStatus.PAID, Order.paid_at >= this_month_start
        )
    )
    this_month_revenue = this_month_rev_res.scalar_one()

    last_month_rev_res = await session.execute(
        select(func.coalesce(func.sum(Order.amount), 0)).where(
            Order.status == OrderStatus.PAID,
            Order.paid_at >= last_month_start,
            Order.paid_at < last_month_end,
        )
    )
    last_month_revenue = last_month_rev_res.scalar_one()

    revenue_growth_pct = None
    if last_month_revenue > 0:
        revenue_growth_pct = round(
            (this_month_revenue - last_month_revenue) / last_month_revenue * 100, 1
        )

    return AdminDashboardStats(
        total_revenue=int(total_revenue),
        total_users=int(total_users),
        active_licenses=int(active_licenses),
        total_orders=int(total_orders),
        pending_orders=int(pending_orders),
        revenue_growth_pct=revenue_growth_pct,
    )


async def get_all_orders(
    session: AsyncSession,
    status_filter: OrderStatus | None = None,
    user_id_filter: uuid.UUID | None = None,
) -> list[Order]:
    await expire_stale_orders(session)

    query = select(Order).options(
        selectinload(Order.plan), selectinload(Order.user)
    )
    if status_filter:
        query = query.where(Order.status == status_filter)
    if user_id_filter:
        query = query.where(Order.user_id == user_id_filter)
    query = query.order_by(Order.created_at.desc())

    result = await session.execute(query)
    return list(result.scalars().all())


async def get_all_licenses(
    session: AsyncSession,
    status_filter: LicenseStatus | None = None,
    search_query: str | None = None,
) -> list[License]:
    query = select(License).options(
        selectinload(License.plan), selectinload(License.user)
    )
    if status_filter:
        query = query.where(License.status == status_filter)
    if search_query:
        search_pattern = f"%{search_query}%"
        query = query.where(
            License.license_key.ilike(search_pattern)
            | License.device_id.ilike(search_pattern)
        )
    query = query.order_by(License.created_at.desc())

    result = await session.execute(query)
    return list(result.scalars().all())


async def reset_license_device(session: AsyncSession, license_id: uuid.UUID) -> License:
    result = await session.execute(
        select(License).options(selectinload(License.plan), selectinload(License.user)).where(License.id == license_id)
    )
    license_obj = result.scalar_one_or_none()
    if not license_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"License {license_id} not found",
        )

    license_obj.device_id = None
    if license_obj.status == LicenseStatus.ACTIVE:
        license_obj.status = LicenseStatus.PENDING

    await session.commit()
    return license_obj


async def update_license_status(
    session: AsyncSession, license_id: uuid.UUID, new_status: LicenseStatus
) -> License:
    result = await session.execute(
        select(License).options(selectinload(License.plan), selectinload(License.user)).where(License.id == license_id)
    )
    license_obj = result.scalar_one_or_none()
    if not license_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"License {license_id} not found",
        )

    license_obj.status = new_status
    await session.commit()
    return license_obj


async def extend_license(
    session: AsyncSession, license_id: uuid.UUID, days: int
) -> License:
    result = await session.execute(
        select(License).options(selectinload(License.plan), selectinload(License.user)).where(License.id == license_id)
    )
    license_obj = result.scalar_one_or_none()
    if not license_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"License {license_id} not found",
        )

    now = datetime.now(timezone.utc)
    current_expiry = ensure_utc(license_obj.expires_at) or now
    base_time = max(current_expiry, now)
    license_obj.expires_at = base_time + timedelta(days=days)

    if license_obj.status == LicenseStatus.EXPIRED:
        license_obj.status = LicenseStatus.ACTIVE

    await session.commit()
    return license_obj


async def create_release(session: AsyncSession, payload: ReleaseCreate) -> Release:
    existing = await session.execute(
        select(Release).where(Release.version == payload.version)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Release version {payload.version} already exists",
        )

    release = Release(
        version=payload.version,
        download_url=payload.download_url,
        release_notes=payload.release_notes,
        minimum_revit_version=payload.minimum_revit_version,
        maximum_revit_version=payload.maximum_revit_version,
        is_active=payload.is_active,
    )
    session.add(release)
    await session.commit()
    return release


async def get_all_releases(session: AsyncSession) -> list[Release]:
    result = await session.execute(
        select(Release).order_by(Release.released_at.desc())
    )
    return list(result.scalars().all())


async def get_all_customers(session: AsyncSession) -> list[AdminCustomerRead]:
    spent_subq = (
        select(
            Order.user_id.label("user_id"),
            func.coalesce(func.sum(Order.amount), 0).label("total_spent"),
            func.min(Order.created_at).label("joined_at"),
        )
        .where(Order.status == OrderStatus.PAID)
        .group_by(Order.user_id)
        .subquery()
    )

    result = await session.execute(
        select(User, spent_subq.c.total_spent, spent_subq.c.joined_at).outerjoin(
            spent_subq, User.id == spent_subq.c.user_id
        )
    )

    customers = []
    for user, total_spent, joined_at in result.unique().all():
        customers.append(
            AdminCustomerRead(
                id=user.id,
                name=user.name,
                email=user.email,
                phone=user.phone,
                is_active=user.is_active,
                total_spent=int(total_spent or 0),
                joined_at=joined_at,
            )
        )
    return customers


async def get_all_payments(session: AsyncSession) -> list[AdminPaymentRead]:
    result = await session.execute(
        select(Payment, Order.order_code)
        .join(Order, Payment.order_id == Order.id)
        .order_by(Payment.created_at.desc())
    )

    return [
        AdminPaymentRead(
            id=payment.id,
            order_id=payment.order_id,
            order_code=order_code,
            provider=payment.provider,
            transaction_id=payment.transaction_id,
            amount=payment.amount,
            status=payment.status,
            created_at=payment.created_at,
        )
        for payment, order_code in result.all()
    ]


async def get_revenue_report(
    session: AsyncSession, months: int = 6
) -> list[RevenueMonthRead]:
    now = datetime.now(timezone.utc)
    periods: list[tuple[datetime, datetime, str]] = []
    year, month = now.year, now.month
    for _ in range(months):
        period_start = datetime(year, month, 1, tzinfo=timezone.utc)
        if month == 12:
            period_end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
        else:
            period_end = datetime(year, month + 1, 1, tzinfo=timezone.utc)
        periods.append((period_start, period_end, f"{month:02d}/{year}"))
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    periods.reverse()

    report = []
    for period_start, period_end, label in periods:
        res = await session.execute(
            select(
                func.coalesce(func.sum(Order.amount), 0), func.count(Order.id)
            ).where(
                Order.status == OrderStatus.PAID,
                Order.paid_at >= period_start,
                Order.paid_at < period_end,
            )
        )
        revenue, orders_count = res.one()
        report.append(
            RevenueMonthRead(
                period=label, revenue=int(revenue), orders=int(orders_count)
            )
        )
    return report
