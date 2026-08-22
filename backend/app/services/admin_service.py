from datetime import datetime, timedelta, timezone
import secrets
import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.audit_log import AuditLog
from app.models.device import Device
from app.models.device_trial import DeviceTrial, DeviceTrialStatus
from app.models.license import License, LicenseStatus
from app.models.license_feature import LicenseFeature
from app.models.order import Order, OrderStatus
from app.models.payment import Payment
from app.models.product import Product
from app.models.release import Release
from app.models.user import User
from app.schemas.admin import (
    AdminCustomerRead,
    AdminDashboardStats,
    AdminDeviceTrialRead,
    AdminLicenseCreate,
    AdminLicensePatch,
    AdminLicenseRead,
    AdminPaymentRead,
    AdminUserRead,
    ReleaseCreate,
    RevenueMonthRead,
)
from app.services.audit_service import log_audit_event
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


async def get_all_users(
    session: AsyncSession, search_query: str | None = None
) -> list[User]:
    query = select(User)
    if search_query:
        p = f"%{search_query}%"
        query = query.where(User.email.ilike(p) | User.name.ilike(p))
    query = query.order_by(User.created_at.desc())
    result = await session.execute(query)
    return list(result.scalars().all())


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
        selectinload(License.plan),
        selectinload(License.user),
        selectinload(License.features),
        selectinload(License.devices),
    )
    if status_filter:
        query = query.where(License.status == status_filter)
    if search_query:
        search_pattern = f"%{search_query}%"
        query = query.where(
            License.license_key.ilike(search_pattern)
            | License.device_id.ilike(search_pattern)
            | License.plan_name.ilike(search_pattern)
        )
    query = query.order_by(License.created_at.desc())

    result = await session.execute(query)
    return list(result.scalars().all())


async def create_license(
    session: AsyncSession,
    payload: AdminLicenseCreate,
    actor_user_id: uuid.UUID,
) -> License:
    # Check user
    u_res = await session.execute(select(User).where(User.id == payload.user_id))
    user = u_res.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Generate key
    key = f"BP-{secrets.token_hex(4).upper()}-{secrets.token_hex(4).upper()}-{secrets.token_hex(4).upper()}"
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=payload.days_valid)

    # Get product
    prod_res = await session.execute(select(Product))
    prod = prod_res.scalars().first()

    license_obj = License(
        license_key=key,
        user_id=user.id,
        product_id=prod.id if prod else None,
        plan_name=payload.plan,
        status=LicenseStatus.ACTIVE,
        max_devices=payload.max_devices,
        starts_at=now,
        expires_at=expires_at,
        activated_at=now,
        created_at=now,
    )
    session.add(license_obj)
    await session.flush()

    # Add custom features
    for f in payload.features:
        session.add(LicenseFeature(license_id=license_obj.id, feature_code=f))

    await session.commit()
    res = await session.execute(
        select(License)
        .options(
            selectinload(License.features),
            selectinload(License.devices),
            selectinload(License.plan),
            selectinload(License.user),
        )
        .where(License.id == license_obj.id)
    )
    license_obj = res.scalar_one()

    await log_audit_event(
        session=session,
        action="admin_license_created",
        target_type="license",
        target_id=str(license_obj.id),
        actor_user_id=actor_user_id,
        metadata={"user_id": str(user.id), "plan": payload.plan, "license_key": key},
    )

    return license_obj


async def patch_license(
    session: AsyncSession,
    license_id: uuid.UUID,
    payload: AdminLicensePatch,
    actor_user_id: uuid.UUID,
) -> License:
    result = await session.execute(
        select(License)
        .options(selectinload(License.plan), selectinload(License.user), selectinload(License.features), selectinload(License.devices))
        .where(License.id == license_id)
    )
    license_obj = result.scalar_one_or_none()
    if not license_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"License {license_id} not found",
        )

    if payload.plan is not None:
        license_obj.plan_name = payload.plan
    if payload.status is not None:
        license_obj.status = payload.status
        if payload.status == LicenseStatus.REVOKED:
            license_obj.revoked_at = datetime.now(timezone.utc)
    if payload.max_devices is not None:
        license_obj.max_devices = payload.max_devices
    if payload.expires_at is not None:
        license_obj.expires_at = payload.expires_at

    license_obj.updated_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(license_obj)

    await log_audit_event(
        session=session,
        action="admin_license_patched",
        target_type="license",
        target_id=str(license_obj.id),
        actor_user_id=actor_user_id,
        metadata={"status": license_obj.status.value, "max_devices": license_obj.max_devices},
    )

    return license_obj


async def revoke_license(
    session: AsyncSession,
    license_id: uuid.UUID,
    actor_user_id: uuid.UUID,
) -> License:
    result = await session.execute(
        select(License)
        .options(selectinload(License.plan), selectinload(License.user), selectinload(License.features), selectinload(License.devices))
        .where(License.id == license_id)
    )
    license_obj = result.scalar_one_or_none()
    if not license_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"License {license_id} not found",
        )

    now = datetime.now(timezone.utc)
    license_obj.status = LicenseStatus.REVOKED
    license_obj.revoked_at = now
    license_obj.updated_at = now

    # Also revoke all associated devices
    for dev in license_obj.devices:
        dev.revoked_at = now

    await session.commit()
    await session.refresh(license_obj)

    await log_audit_event(
        session=session,
        action="admin_license_revoked",
        target_type="license",
        target_id=str(license_obj.id),
        actor_user_id=actor_user_id,
    )

    return license_obj


from sqlalchemy import delete

async def set_license_features(
    session: AsyncSession,
    license_id: uuid.UUID,
    features: list[str],
    actor_user_id: uuid.UUID,
) -> License:
    result = await session.execute(
        select(License).where(License.id == license_id)
    )
    license_obj = result.scalar_one_or_none()
    if not license_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"License {license_id} not found",
        )

    # Delete existing features explicitly
    await session.execute(
        delete(LicenseFeature).where(LicenseFeature.license_id == license_id)
    )
    await session.flush()

    for f in set(features):
        session.add(LicenseFeature(license_id=license_id, feature_code=f))

    license_obj.updated_at = datetime.now(timezone.utc)
    await session.commit()

    res = await session.execute(
        select(License)
        .options(
            selectinload(License.features),
            selectinload(License.devices),
            selectinload(License.plan),
            selectinload(License.user),
        )
        .where(License.id == license_id)
    )
    license_obj = res.scalar_one()

    await log_audit_event(
        session=session,
        action="admin_license_features_updated",
        target_type="license",
        target_id=str(license_obj.id),
        actor_user_id=actor_user_id,
        metadata={"features": features},
    )

    return license_obj


async def revoke_device_from_license(
    session: AsyncSession,
    license_id: uuid.UUID,
    device_id: uuid.UUID,
    actor_user_id: uuid.UUID,
) -> bool:
    res = await session.execute(
        select(Device).where(Device.id == device_id, Device.license_id == license_id)
    )
    device = res.scalar_one_or_none()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found on this license",
        )

    device.revoked_at = datetime.now(timezone.utc)
    await session.commit()

    await log_audit_event(
        session=session,
        action="admin_device_revoked",
        target_type="device",
        target_id=str(device.id),
        actor_user_id=actor_user_id,
        metadata={"license_id": str(license_id)},
    )
    return True


async def get_all_device_trials(
    session: AsyncSession, search_query: str | None = None
) -> list[AdminDeviceTrialRead]:
    query = select(DeviceTrial).options(
        selectinload(DeviceTrial.initial_user), selectinload(DeviceTrial.last_user)
    )
    if search_query:
        p = f"%{search_query}%"
        query = query.where(
            DeviceTrial.fingerprint_hash.ilike(p)
            | DeviceTrial.display_name.ilike(p)
        )
    query = query.order_by(DeviceTrial.created_at.desc())

    result = await session.execute(query)
    trials = result.scalars().all()
    output = []
    for t in trials:
        output.append(
            AdminDeviceTrialRead(
                id=t.id,
                fingerprint_hash=t.fingerprint_hash,
                display_name=t.display_name,
                platform=t.platform,
                revit_version=t.revit_version,
                app_version=t.app_version,
                first_trial_at=t.first_trial_at,
                trial_expires_at=t.trial_expires_at,
                status=t.status.value,
                reset_count=t.reset_count,
                initial_user_email=t.initial_user.email if t.initial_user else None,
                last_user_email=t.last_user.email if t.last_user else None,
                created_at=t.created_at,
            )
        )
    return output


async def get_audit_logs(
    session: AsyncSession, limit: int = 100
) -> list[AuditLog]:
    res = await session.execute(
        select(AuditLog).options(selectinload(AuditLog.actor)).order_by(AuditLog.created_at.desc()).limit(limit)
    )
    return list(res.scalars().all())


async def reset_license_device(session: AsyncSession, license_id: uuid.UUID) -> License:
    result = await session.execute(
        select(License).options(selectinload(License.plan), selectinload(License.user), selectinload(License.features), selectinload(License.devices)).where(License.id == license_id)
    )
    license_obj = result.scalar_one_or_none()
    if not license_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"License {license_id} not found",
        )

    license_obj.device_id = None
    for d in license_obj.devices:
        d.revoked_at = datetime.now(timezone.utc)

    if license_obj.status == LicenseStatus.ACTIVE:
        license_obj.status = LicenseStatus.PENDING

    await session.commit()
    return license_obj


async def update_license_status(
    session: AsyncSession, license_id: uuid.UUID, new_status: LicenseStatus
) -> License:
    result = await session.execute(
        select(License).options(selectinload(License.plan), selectinload(License.user), selectinload(License.features), selectinload(License.devices)).where(License.id == license_id)
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
        select(License).options(selectinload(License.plan), selectinload(License.user), selectinload(License.features), selectinload(License.devices)).where(License.id == license_id)
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
                job_title=user.job_title,
                revit_version=user.revit_version,
                use_case=user.use_case,
                is_trial_registered=user.is_trial_registered,
                is_active=user.is_active,
                total_spent=int(total_spent or 0),
                joined_at=joined_at or user.created_at,
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
