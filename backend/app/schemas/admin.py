from datetime import datetime
from typing import Any
import uuid

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.device_trial import DeviceTrialStatus
from app.models.license import LicenseStatus
from app.models.user import UserRole, UserStatus
from app.schemas.plan import PlanRead


class AdminDashboardStats(BaseModel):
    total_revenue: int
    total_users: int
    active_licenses: int
    total_orders: int
    pending_orders: int
    revenue_growth_pct: float | None = None


class AdminUserSummary(BaseModel):
    id: uuid.UUID
    email: str
    name: str | None
    phone: str | None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class AdminUserRead(BaseModel):
    id: uuid.UUID
    email: str
    name: str | None = None
    display_name: str | None = None
    phone: str | None = None
    job_title: str | None = None
    revit_version: str | None = None
    use_case: str | None = None
    is_trial_registered: bool = False
    trial_registered_at: datetime | None = None
    role: str
    status: str
    is_active: bool
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class AdminDeviceRead(BaseModel):
    id: uuid.UUID
    installation_id: str
    fingerprint_hash: str
    display_name: str
    platform: str
    revit_version: str
    app_version: str
    first_seen_at: datetime
    last_seen_at: datetime
    revoked_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class AdminLicenseRead(BaseModel):
    id: uuid.UUID
    license_key: str
    user_id: uuid.UUID | None = None
    device_id: str | None = None
    plan: PlanRead | None = None
    plan_name: str = "standard"
    status: str
    max_devices: int = 1
    starts_at: datetime | None = None
    expires_at: datetime | None = None
    activated_at: datetime | None = None
    revoked_at: datetime | None = None
    created_at: datetime
    user: AdminUserSummary | None = None
    features: list[str] = []
    devices: list[AdminDeviceRead] = []
    is_currently_online: bool = False
    last_seen_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class AdminLicenseCreate(BaseModel):
    user_id: uuid.UUID
    plan: str = "standard"
    max_devices: int = 1
    days_valid: int = 365
    features: list[str] = []


class AdminLicensePatch(BaseModel):
    plan: str | None = None
    status: LicenseStatus | None = None
    max_devices: int | None = None
    expires_at: datetime | None = None


class AdminFeatureToggleRequest(BaseModel):
    features: list[str]


class AdminDeviceTrialRead(BaseModel):
    id: uuid.UUID
    fingerprint_hash: str
    display_name: str
    platform: str
    revit_version: str
    app_version: str
    first_trial_at: datetime
    trial_expires_at: datetime
    status: str
    reset_count: int
    initial_user_email: str | None = None
    last_user_email: str | None = None
    is_currently_active: bool = False
    is_currently_online: bool = False
    last_seen_at: datetime | None = None
    created_at: datetime


class AdminAuditLogRead(BaseModel):
    id: uuid.UUID
    actor_user_id: uuid.UUID | None = None
    actor_email: str | None = None
    action: str
    target_type: str
    target_id: str | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    metadata_json: str | None = None
    created_at: datetime


class AdminOrderRead(BaseModel):
    id: uuid.UUID
    order_code: str
    amount: int
    status: str
    created_at: datetime
    paid_at: datetime | None
    plan: PlanRead | None = None
    user: AdminUserSummary | None = None

    model_config = ConfigDict(from_attributes=True)


class AdminCustomerRead(BaseModel):
    id: uuid.UUID
    name: str | None
    email: str
    phone: str | None
    job_title: str | None = None
    revit_version: str | None = None
    use_case: str | None = None
    is_trial_registered: bool = False
    role: str
    is_active: bool
    total_spent: int
    joined_at: datetime | None
    active_plan: str | None = None
    license_status: str | None = None


class AdminPaymentRead(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    order_code: str
    provider: str
    transaction_id: str | None
    amount: int
    status: str
    created_at: datetime


class RevenueMonthRead(BaseModel):
    period: str
    revenue: int
    orders: int


class LicenseStatusUpdate(BaseModel):
    status: LicenseStatus


from app.schemas.account import ReleasePackageItem


class LicenseExtendRequest(BaseModel):
    days: int = Field(..., gt=0)


class ReleaseCreate(BaseModel):
    version: str
    download_url: str
    release_notes: str | None = None
    minimum_revit_version: int | None = 2022
    maximum_revit_version: int | None = 2027
    file_size_label: str | None = "71.4 MB"
    sha256_hash: str | None = None
    is_active: bool = True
    packages: list[ReleasePackageItem] = []


class ReleaseRead(BaseModel):
    id: uuid.UUID
    version: str
    download_url: str
    release_notes: str | None = None
    minimum_revit_version: int | None = 2022
    maximum_revit_version: int | None = 2027
    file_size_label: str | None = "71.4 MB"
    sha256_hash: str | None = None
    is_active: bool = True
    released_at: datetime
    packages: list[ReleasePackageItem] = Field(default_factory=list)

    @field_validator("packages", mode="before")
    @classmethod
    def validate_packages(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            try:
                import json
                return json.loads(v)
            except Exception:
                return []
        return v

    model_config = ConfigDict(from_attributes=True)
