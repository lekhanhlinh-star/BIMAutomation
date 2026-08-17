from datetime import datetime
import uuid

from pydantic import BaseModel, ConfigDict

from app.schemas.plan import PlanRead


class CustomerLicenseRead(BaseModel):
    id: uuid.UUID
    license_key: str
    device_id: str | None
    status: str
    activated_at: datetime | None
    expires_at: datetime | None
    created_at: datetime
    plan: PlanRead | None = None

    model_config = ConfigDict(from_attributes=True)


class CustomerOrderRead(BaseModel):
    id: uuid.UUID
    order_code: str
    amount: int
    status: str
    created_at: datetime
    paid_at: datetime | None
    plan: PlanRead | None = None

    model_config = ConfigDict(from_attributes=True)


class LatestReleaseRead(BaseModel):
    id: uuid.UUID
    version: str
    download_url: str
    release_notes: str | None
    minimum_revit_version: int | None
    maximum_revit_version: int | None
    released_at: datetime

    model_config = ConfigDict(from_attributes=True)
