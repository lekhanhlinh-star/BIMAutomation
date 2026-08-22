from datetime import datetime
from typing import Any
import uuid

from fastapi_users import schemas
from pydantic import BaseModel, Field

from app.models.user import UserRole, UserStatus


class UserRead(schemas.BaseUser[uuid.UUID]):
    name: str | None = None
    phone: str | None = None
    role: UserRole = UserRole.USER
    status: UserStatus = UserStatus.ACTIVE
    job_title: str | None = None
    revit_version: str | None = None
    use_case: str | None = None
    is_trial_registered: bool = False
    trial_registered_at: datetime | None = None
    oauth_accounts: list[schemas.BaseOAuthAccount] = []


class UserCreate(schemas.BaseUserCreate):
    name: str | None = None
    phone: str | None = None
    role: UserRole = UserRole.USER


class UserUpdate(schemas.BaseUserUpdate):
    name: str | None = None
    phone: str | None = None
    role: UserRole | None = None
    job_title: str | None = None
    revit_version: str | None = None
    use_case: str | None = None


class TrialRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Họ và tên của kỹ sư")
    phone: str = Field(..., min_length=8, max_length=20, description="Số điện thoại / Zalo liên hệ")
    job_title: str = Field(..., description="Vị trí nghề nghiệp (Kết cấu, MEP, Kiến trúc, BIM...)")
    revit_version: str = Field("2025", description="Phiên bản Autodesk Revit đang sử dụng")
    use_case: str | None = Field(None, description="Nhu cầu sử dụng chính")
    terms_accepted: bool = Field(True, description="Đồng ý điều khoản chính sách")


class TrialRegisterResponse(BaseModel):
    success: bool
    is_trial_registered: bool
    trial_registered_at: datetime | None = None
    message: str
