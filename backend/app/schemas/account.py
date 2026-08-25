from datetime import datetime
import uuid

from pydantic import BaseModel, ConfigDict, Field, field_validator

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


class ReleasePackageItem(BaseModel):
    revit_version: int
    url: str
    sha256: str
    file_size_bytes: int | None = None

    model_config = ConfigDict(from_attributes=True)


class LatestReleaseRead(BaseModel):
    version: str
    download_url: str
    sha256_hash: str | None = None
    release_notes: str | None = None
    file_size_label: str | None = "71.4 MB"
    minimum_revit_version: int | None = 2022
    maximum_revit_version: int | None = 2027
    packages: list[ReleasePackageItem] = Field(default_factory=list)
    id: uuid.UUID | None = None
    released_at: datetime | None = None

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
