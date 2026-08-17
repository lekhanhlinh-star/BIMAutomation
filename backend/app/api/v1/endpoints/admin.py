from typing import Annotated
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentAdminUserDep
from app.db.session import get_async_session
from app.models.feedback import FeedbackStatus, FeedbackType
from app.models.license import LicenseStatus
from app.models.order import OrderStatus
from app.schemas.admin import (
    AdminCustomerRead,
    AdminDashboardStats,
    AdminLicenseRead,
    AdminOrderRead,
    AdminPaymentRead,
    LicenseExtendRequest,
    LicenseStatusUpdate,
    ReleaseCreate,
    ReleaseRead,
    RevenueMonthRead,
)
from app.schemas.feedback import FeedbackRead
from app.services import admin_service, feedback_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard", response_model=dict[str, str])
def admin_dashboard(admin: CurrentAdminUserDep) -> dict[str, str]:
    return {
        "message": f"Welcome to Admin Dashboard, {admin.email}!",
        "role": admin.role,
    }


@router.get("/dashboard/stats", response_model=AdminDashboardStats)
async def get_admin_dashboard_stats(
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> AdminDashboardStats:
    return await admin_service.get_dashboard_stats(db)


@router.get("/orders", response_model=list[AdminOrderRead])
async def get_admin_orders(
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
    status_filter: OrderStatus | None = None,
    user_id_filter: uuid.UUID | None = None,
) -> list[AdminOrderRead]:
    orders = await admin_service.get_all_orders(
        db, status_filter=status_filter, user_id_filter=user_id_filter
    )
    return [AdminOrderRead.model_validate(order) for order in orders]


@router.get("/licenses", response_model=list[AdminLicenseRead])
async def get_admin_licenses(
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
    status_filter: LicenseStatus | None = None,
    search: str | None = None,
) -> list[AdminLicenseRead]:
    licenses = await admin_service.get_all_licenses(
        db, status_filter=status_filter, search_query=search
    )
    return [AdminLicenseRead.model_validate(lic) for lic in licenses]


@router.post(
    "/licenses/{license_id}/reset-device", response_model=AdminLicenseRead
)
async def reset_license_device(
    license_id: uuid.UUID,
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> AdminLicenseRead:
    license_obj = await admin_service.reset_license_device(db, license_id)
    return AdminLicenseRead.model_validate(license_obj)


@router.post("/licenses/{license_id}/status", response_model=AdminLicenseRead)
async def update_license_status(
    license_id: uuid.UUID,
    payload: LicenseStatusUpdate,
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> AdminLicenseRead:
    license_obj = await admin_service.update_license_status(
        db, license_id, payload.status
    )
    return AdminLicenseRead.model_validate(license_obj)


@router.post("/licenses/{license_id}/extend", response_model=AdminLicenseRead)
async def extend_license(
    license_id: uuid.UUID,
    payload: LicenseExtendRequest,
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> AdminLicenseRead:
    license_obj = await admin_service.extend_license(db, license_id, payload.days)
    return AdminLicenseRead.model_validate(license_obj)


@router.get("/customers", response_model=list[AdminCustomerRead])
async def get_admin_customers(
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> list[AdminCustomerRead]:
    return await admin_service.get_all_customers(db)


@router.get("/payments", response_model=list[AdminPaymentRead])
async def get_admin_payments(
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> list[AdminPaymentRead]:
    return await admin_service.get_all_payments(db)


@router.get("/revenue", response_model=list[RevenueMonthRead])
async def get_admin_revenue(
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
    months: int = 6,
) -> list[RevenueMonthRead]:
    return await admin_service.get_revenue_report(db, months=months)


@router.get("/releases", response_model=list[ReleaseRead])
async def get_admin_releases(
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> list[ReleaseRead]:
    releases = await admin_service.get_all_releases(db)
    return [ReleaseRead.model_validate(rel) for rel in releases]


@router.post(
    "/releases", response_model=ReleaseRead, status_code=status.HTTP_201_CREATED
)
async def create_new_release(
    payload: ReleaseCreate,
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> ReleaseRead:
    release = await admin_service.create_release(db, payload)
    return ReleaseRead.model_validate(release)


@router.get("/feedbacks", response_model=list[FeedbackRead])
async def get_admin_feedbacks(
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
    type_filter: FeedbackType | None = None,
    status_filter: FeedbackStatus | None = None,
) -> list[FeedbackRead]:
    feedbacks = await feedback_service.get_all_feedbacks(
        db, type_filter=type_filter, status_filter=status_filter
    )
    return [FeedbackRead.model_validate(fb) for fb in feedbacks]
