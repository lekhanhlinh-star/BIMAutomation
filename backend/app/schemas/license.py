from datetime import datetime
import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.models.license import LicenseStatus


class LicenseRead(BaseModel):
    id: uuid.UUID
    license_key: str
    user_id: uuid.UUID
    order_id: uuid.UUID
    plan_id: uuid.UUID
    device_id: str | None = None
    status: LicenseStatus
    activated_at: datetime | None = None
    expires_at: datetime | None = None
    last_checked_at: datetime | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LicenseActivateRequest(BaseModel):
    license_key: str = Field(alias="licenseKey")
    device_id: str = Field(alias="deviceId")

    model_config = ConfigDict(populate_by_name=True)


class LicenseActivateResponse(BaseModel):
    success: bool
    status: LicenseStatus
    expires_at: datetime | None = Field(default=None, alias="expiresAt")
    message: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class LicenseVerifyRequest(BaseModel):
    license_key: str = Field(alias="licenseKey")
    device_id: str = Field(alias="deviceId")

    model_config = ConfigDict(populate_by_name=True)


class LicenseVerifyResponse(BaseModel):
    valid: bool
    status: LicenseStatus
    expires_at: datetime | None = Field(default=None, alias="expiresAt")

    model_config = ConfigDict(populate_by_name=True)

