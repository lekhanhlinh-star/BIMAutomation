from typing import Annotated, Any
import uuid

from fastapi import APIRouter, Depends, Form, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentAdminUserDep
from app.db.session import get_async_session
from app.models.feedback import FeedbackStatus, FeedbackType
from app.models.license import LicenseStatus
from app.models.order import OrderStatus
from app.schemas.admin import (
    AdminAuditLogRead,
    AdminCustomerRead,
    AdminDashboardStats,
    AdminDeviceTrialRead,
    AdminFeatureToggleRequest,
    AdminLicenseCreate,
    AdminLicensePatch,
    AdminLicenseRead,
    AdminOrderRead,
    AdminPaymentRead,
    AdminUserRead,
    LicenseExtendRequest,
    LicenseStatusUpdate,
    ReleaseCreate,
    ReleaseRead,
    RevenueMonthRead,
)
from app.schemas.feedback import FeedbackRead
from app.services import admin_service, feedback_service, trial_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard", response_model=dict[str, str])
def admin_dashboard(admin: CurrentAdminUserDep) -> dict[str, str]:
    return {
        "message": f"Welcome to Admin Dashboard, {admin.email}!",
        "role": admin.role.value if hasattr(admin.role, "value") else str(admin.role),
    }


@router.get("/dashboard/stats", response_model=AdminDashboardStats)
async def get_admin_dashboard_stats(
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> AdminDashboardStats:
    return await admin_service.get_dashboard_stats(db)


@router.get("/users", response_model=list[AdminUserRead])
async def get_admin_users(
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
    search: str | None = None,
) -> list[AdminUserRead]:
    users = await admin_service.get_all_users(db, search_query=search)
    return [
        AdminUserRead(
            id=u.id,
            email=u.email,
            name=u.name,
            display_name=u.display_name,
            phone=u.phone,
            role=u.role.value if hasattr(u.role, "value") else str(u.role),
            status=u.status.value if hasattr(u.status, "value") else str(u.status),
            is_active=u.is_active,
            created_at=u.created_at,
        )
        for u in users
    ]


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
    output = []
    for lic in licenses:
        output.append(
            AdminLicenseRead(
                id=lic.id,
                license_key=lic.license_key,
                user_id=lic.user_id,
                device_id=lic.device_id,
                plan=lic.plan,
                plan_name=lic.plan_name,
                status=lic.status.value if hasattr(lic.status, "value") else str(lic.status),
                max_devices=lic.max_devices,
                starts_at=lic.starts_at,
                expires_at=lic.expires_at,
                activated_at=lic.activated_at,
                revoked_at=lic.revoked_at,
                created_at=lic.created_at,
                user=lic.user,
                is_currently_online=bool(
                    lic.status == LicenseStatus.ACTIVE
                    and lic.user
                    and lic.user.active_device_fingerprint
                    and admin_service.is_recently_online(lic.user.active_device_last_seen)
                ),
                last_seen_at=lic.user.active_device_last_seen if lic.user else None,
                features=[f.feature_code for f in getattr(lic, "features", [])],
                devices=[
                    {
                        "id": d.id,
                        "installation_id": d.installation_id,
                        "fingerprint_hash": d.fingerprint_hash,
                        "display_name": d.display_name,
                        "platform": d.platform,
                        "revit_version": d.revit_version,
                        "app_version": d.app_version,
                        "first_seen_at": d.first_seen_at,
                        "last_seen_at": d.last_seen_at,
                        "revoked_at": d.revoked_at,
                    }
                    for d in getattr(lic, "devices", [])
                ],
            )
        )
    return output


@router.post("/licenses", response_model=AdminLicenseRead, status_code=status.HTTP_201_CREATED)
async def create_admin_license(
    payload: AdminLicenseCreate,
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> AdminLicenseRead:
    license_obj = await admin_service.create_license(db, payload, actor_user_id=admin.id)
    return AdminLicenseRead(
        id=license_obj.id,
        license_key=license_obj.license_key,
        user_id=license_obj.user_id,
        plan_name=license_obj.plan_name,
        status=license_obj.status.value,
        max_devices=license_obj.max_devices,
        starts_at=license_obj.starts_at,
        expires_at=license_obj.expires_at,
        activated_at=license_obj.activated_at,
        created_at=license_obj.created_at,
        features=[f.feature_code for f in getattr(license_obj, "features", [])],
    )


@router.patch("/licenses/{license_id}", response_model=AdminLicenseRead)
async def patch_admin_license(
    license_id: uuid.UUID,
    payload: AdminLicensePatch,
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> AdminLicenseRead:
    license_obj = await admin_service.patch_license(db, license_id, payload, actor_user_id=admin.id)
    return AdminLicenseRead(
        id=license_obj.id,
        license_key=license_obj.license_key,
        user_id=license_obj.user_id,
        plan_name=license_obj.plan_name,
        status=license_obj.status.value,
        max_devices=license_obj.max_devices,
        starts_at=license_obj.starts_at,
        expires_at=license_obj.expires_at,
        activated_at=license_obj.activated_at,
        created_at=license_obj.created_at,
        features=[f.feature_code for f in getattr(license_obj, "features", [])],
    )


@router.post("/licenses/{license_id}/revoke", response_model=AdminLicenseRead)
async def revoke_admin_license(
    license_id: uuid.UUID,
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> AdminLicenseRead:
    license_obj = await admin_service.revoke_license(db, license_id, actor_user_id=admin.id)
    return AdminLicenseRead(
        id=license_obj.id,
        license_key=license_obj.license_key,
        user_id=license_obj.user_id,
        plan_name=license_obj.plan_name,
        status=license_obj.status.value,
        max_devices=license_obj.max_devices,
        expires_at=license_obj.expires_at,
        revoked_at=license_obj.revoked_at,
        created_at=license_obj.created_at,
    )


@router.post("/licenses/{license_id}/features", response_model=AdminLicenseRead)
async def update_license_features(
    license_id: uuid.UUID,
    payload: AdminFeatureToggleRequest,
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> AdminLicenseRead:
    license_obj = await admin_service.set_license_features(db, license_id, payload.features, actor_user_id=admin.id)
    return AdminLicenseRead(
        id=license_obj.id,
        license_key=license_obj.license_key,
        user_id=license_obj.user_id,
        plan_name=license_obj.plan_name,
        status=license_obj.status.value,
        max_devices=license_obj.max_devices,
        expires_at=license_obj.expires_at,
        created_at=license_obj.created_at,
        features=[f.feature_code for f in getattr(license_obj, "features", [])],
    )


@router.delete("/licenses/{license_id}/devices/{device_id}")
async def delete_license_device(
    license_id: uuid.UUID,
    device_id: uuid.UUID,
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> dict[str, str]:
    await admin_service.revoke_device_from_license(db, license_id, device_id, actor_user_id=admin.id)
    return {"status": "ok", "message": "Thiết bị đã được thu hồi"}


@router.post("/licenses/{license_id}/reset-device", response_model=AdminLicenseRead)
async def reset_license_device(
    license_id: uuid.UUID,
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> AdminLicenseRead:
    license_obj = await admin_service.reset_license_device(db, license_id)
    return AdminLicenseRead(
        id=license_obj.id,
        license_key=license_obj.license_key,
        user_id=license_obj.user_id,
        plan_name=license_obj.plan_name,
        status=license_obj.status.value,
        max_devices=license_obj.max_devices,
        created_at=license_obj.created_at,
    )


@router.post("/licenses/{license_id}/status", response_model=AdminLicenseRead)
async def update_license_status(
    license_id: uuid.UUID,
    payload: LicenseStatusUpdate,
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> AdminLicenseRead:
    license_obj = await admin_service.update_license_status(db, license_id, payload.status)
    return AdminLicenseRead(
        id=license_obj.id,
        license_key=license_obj.license_key,
        user_id=license_obj.user_id,
        plan_name=license_obj.plan_name,
        status=license_obj.status.value,
        max_devices=license_obj.max_devices,
        created_at=license_obj.created_at,
    )


@router.post("/licenses/{license_id}/extend", response_model=AdminLicenseRead)
async def extend_license(
    license_id: uuid.UUID,
    payload: LicenseExtendRequest,
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> AdminLicenseRead:
    license_obj = await admin_service.extend_license(db, license_id, payload.days)
    return AdminLicenseRead(
        id=license_obj.id,
        license_key=license_obj.license_key,
        user_id=license_obj.user_id,
        plan_name=license_obj.plan_name,
        status=license_obj.status.value,
        max_devices=license_obj.max_devices,
        expires_at=license_obj.expires_at,
        created_at=license_obj.created_at,
    )


@router.get("/device-trials", response_model=list[AdminDeviceTrialRead])
async def get_device_trials(
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
    search: str | None = None,
) -> list[AdminDeviceTrialRead]:
    return await admin_service.get_all_device_trials(db, search_query=search)


@router.post("/device-trials/{trial_id}/reset")
async def reset_device_trial_endpoint(
    trial_id: uuid.UUID,
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
    days: int = Query(14, gt=0),
) -> dict[str, Any]:
    trial = await trial_service.reset_device_trial(db, trial_id, additional_days=days)
    return {
        "status": "ok",
        "trialId": str(trial.id),
        "newExpiresAt": trial.trial_expires_at.isoformat(),
        "resetCount": trial.reset_count,
        "message": f"Đã reset phiên dùng thử cho thiết bị ({days} ngày)",
    }


@router.post("/device-trials/{trial_id}/grant")
async def grant_device_trial_endpoint(
    trial_id: uuid.UUID,
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
    days: int = Query(14, gt=0),
) -> dict[str, Any]:
    trial = await trial_service.grant_device_trial(db, trial_id, days=days)
    return {
        "status": "ok",
        "trialId": str(trial.id),
        "newExpiresAt": trial.trial_expires_at.isoformat(),
        "resetCount": trial.reset_count,
        "message": f"Đã cấp quyền dùng thử lại cho thiết bị ({days} ngày)",
    }


@router.post("/device-trials/{trial_id}/revoke")
async def revoke_device_trial_endpoint(
    trial_id: uuid.UUID,
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> dict[str, Any]:
    trial = await trial_service.revoke_device_trial(db, trial_id)
    return {
        "status": "ok",
        "trialId": str(trial.id),
        "status": trial.status.value,
        "message": "Đã thu hồi quyền dùng thử đối với thiết bị này",
    }


@router.post("/device-trials/{trial_id}/block")
async def block_device_trial_endpoint(
    trial_id: uuid.UUID,
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> dict[str, Any]:
    trial = await trial_service.block_device_trial(db, trial_id)
    return {
        "status": "ok",
        "trialId": str(trial.id),
        "status": trial.status.value,
        "message": "Đã khóa dùng thử đối với thiết bị này",
    }


@router.post("/device-trials/{trial_id}/set-active")
async def set_active_device_trial_endpoint(
    trial_id: uuid.UUID,
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> dict[str, Any]:
    trial = await trial_service.set_active_device_trial(db, trial_id)
    return {
        "status": "ok",
        "trialId": str(trial.id),
        "message": "Đã đặt thiết bị làm máy hoạt động (Active) cho tài khoản",
    }


@router.delete("/device-trials/{trial_id}")
async def delete_device_trial_endpoint(
    trial_id: uuid.UUID,
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> dict[str, Any]:
    await trial_service.delete_device_trial(db, trial_id)
    return {
        "status": "ok",
        "trialId": str(trial_id),
        "message": "Đã xóa bản ghi thiết bị dùng thử thành công",
    }



@router.get("/audit-logs", response_model=list[AdminAuditLogRead])
async def get_admin_audit_logs(
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
    limit: int = Query(100, le=500),
) -> list[AdminAuditLogRead]:
    logs = await admin_service.get_audit_logs(db, limit=limit)
    return [
        AdminAuditLogRead(
            id=log.id,
            actor_user_id=log.actor_user_id,
            actor_email=log.actor.email if log.actor else None,
            action=log.action,
            target_type=log.target_type,
            target_id=log.target_id,
            ip_address=log.ip_address,
            user_agent=log.user_agent,
            metadata_json=log.metadata_json,
            created_at=log.created_at,
        )
        for log in logs
    ]


@router.post("/migrate-sheet")
async def migrate_sheet_endpoint(
    request: Request,
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
    dry_run: bool = Query(False),
) -> dict[str, Any]:
    from app.services.migration_service import process_sheet_migration
    content_type = request.headers.get("content-type", "")
    data_input: Any = ""
    if "application/json" in content_type:
        data_input = await request.json()
    else:
        form = await request.form()
        data_input = form.get("csv_content", "")
        if "dry_run" in form:
            dry_run = str(form.get("dry_run")).lower() in ("true", "1", "yes")

    return await process_sheet_migration(db, data_input, dry_run=dry_run, actor_user_id=admin.id)


@router.get("/customers", response_model=list[AdminCustomerRead])
async def get_admin_customers(
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> list[AdminCustomerRead]:
    return await admin_service.get_all_customers(db)


@router.post("/customers/{user_id}/grant-admin", response_model=AdminUserRead)
async def grant_customer_admin_role(
    user_id: uuid.UUID,
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> AdminUserRead:
    user = await admin_service.grant_admin_role(
        db,
        user_id=user_id,
        actor_user_id=admin.id,
    )
    return AdminUserRead(
        id=user.id,
        email=user.email,
        name=user.name,
        display_name=user.display_name,
        phone=user.phone,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        status=user.status.value if hasattr(user.status, "value") else str(user.status),
        is_active=user.is_active,
        created_at=user.created_at,
    )


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


@router.post("/releases", response_model=ReleaseRead, status_code=status.HTTP_201_CREATED)
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


@router.post("/migrate-sheet")
async def migrate_sheet_endpoint(
    request: Request,
    admin: CurrentAdminUserDep,
    db: Annotated[AsyncSession, Depends(get_async_session)],
    payload: Any = None,
    dry_run: bool = False,
) -> dict[str, Any]:
    import csv
    import io
    from app.services.migration_service import import_sheet_records

    records = []
    if isinstance(payload, list):
        records = payload
    elif isinstance(payload, dict):
        if "records" in payload and isinstance(payload["records"], list):
            records = payload["records"]
        elif "csv_content" in payload:
            reader = csv.DictReader(io.StringIO(str(payload["csv_content"])))
            records = list(reader)
        if "dry_run" in payload:
            dry_run = bool(payload["dry_run"])
    else:
        try:
            form = await request.form()
            csv_content = form.get("csv_content")
            form_dry_run = form.get("dry_run")
            if form_dry_run is not None:
                dry_run = str(form_dry_run).lower() in ("true", "1", "yes")
            if csv_content:
                reader = csv.DictReader(io.StringIO(str(csv_content)))
                records = list(reader)
        except Exception:
            pass

    res = await import_sheet_records(
        session=db,
        records=records,
        dry_run=dry_run,
        actor_user_id=admin.id,
    )
    res["dryRun"] = res["dry_run"]
    res["importedCount"] = res["imported"]
    res["errorCount"] = len(res["errors"])
    return res
