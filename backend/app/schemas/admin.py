from datetime import datetime
import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.models.license import LicenseStatus
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


class AdminLicenseRead(BaseModel):
    id: uuid.UUID
    license_key: str
    device_id: str | None
    status: str
    activated_at: datetime | None
    expires_at: datetime | None
    created_at: datetime
    plan: PlanRead | None = None
    user: AdminUserSummary | None = None

    model_config = ConfigDict(from_attributes=True)


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
    is_active: bool
    total_spent: int
    joined_at: datetime | None


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


class LicenseExtendRequest(BaseModel):
    days: int = Field(..., gt=0)


class ReleaseCreate(BaseModel):
    version: str
    download_url: str
    release_notes: str | None = None
    minimum_revit_version: int | None = 2021
    maximum_revit_version: int | None = 2026
    is_active: bool = True


class ReleaseRead(BaseModel):
    id: uuid.UUID
    version: str
    download_url: str
    release_notes: str | None
    minimum_revit_version: int | None
    maximum_revit_version: int | None
    is_active: bool
    released_at: datetime

    model_config = ConfigDict(from_attributes=True)
