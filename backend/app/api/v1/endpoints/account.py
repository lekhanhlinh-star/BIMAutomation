from datetime import datetime, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user_flexible
from app.db.session import get_async_session
from app.models.user import User
from app.schemas.account import CustomerLicenseRead, CustomerOrderRead
from app.schemas.user import TrialRegisterRequest, TrialRegisterResponse
from app.services import account_service
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/account", tags=["account"])


@router.get("/licenses", response_model=list[CustomerLicenseRead])
async def get_my_licenses(
    current_user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> list[CustomerLicenseRead]:
    licenses = await account_service.get_customer_licenses(db, current_user.id)
    return [CustomerLicenseRead.model_validate(lic) for lic in licenses]


@router.get("/orders", response_model=list[CustomerOrderRead])
async def get_my_orders(
    current_user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> list[CustomerOrderRead]:
    orders = await account_service.get_customer_orders(db, current_user.id)
    return [CustomerOrderRead.model_validate(order) for order in orders]


@router.post("/trial-register", response_model=TrialRegisterResponse)
async def register_trial_onboarding(
    payload: TrialRegisterRequest,
    current_user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> TrialRegisterResponse:
    """
    Submits user profile & trial onboarding information (Name, Phone/Zalo, Job Title, Revit Version, Use case).
    """
    now = datetime.now(timezone.utc)
    current_user.name = payload.name.strip()
    current_user.phone = payload.phone.strip()
    current_user.job_title = payload.job_title.strip()
    current_user.revit_version = payload.revit_version.strip()
    if payload.use_case:
        current_user.use_case = payload.use_case.strip()
    current_user.is_trial_registered = True
    current_user.trial_registered_at = now
    current_user.updated_at = now

    await db.commit()
    await db.refresh(current_user)

    await log_audit_event(
        session=db,
        action="user_trial_registered",
        target_type="user",
        target_id=str(current_user.id),
        actor_user_id=current_user.id,
        metadata={
            "phone": current_user.phone,
            "job_title": current_user.job_title,
            "revit_version": current_user.revit_version,
            "use_case": current_user.use_case,
        },
    )

    return TrialRegisterResponse(
        success=True,
        is_trial_registered=True,
        trial_registered_at=current_user.trial_registered_at,
        message="Đăng ký thông tin dùng thử thành công! Bạn có thể bắt đầu sử dụng RevitAPP.",
    )


@router.get("/trial-status")
async def get_trial_status(
    current_user: Annotated[User, Depends(get_current_user_flexible)],
) -> dict[str, Any]:
    """
    Returns user trial registration status and basic engineer profile.
    """
    return {
        "isTrialRegistered": current_user.is_trial_registered,
        "trialRegisteredAt": current_user.trial_registered_at.isoformat() if current_user.trial_registered_at else None,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "jobTitle": current_user.job_title,
        "revitVersion": current_user.revit_version,
        "useCase": current_user.use_case,
    }
