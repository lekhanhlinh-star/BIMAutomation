from datetime import datetime, timezone
from enum import Enum
import uuid

from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from sqlalchemy import Boolean, DateTime, Enum as SQLEnum, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.oauth import OAuthAccount


class UserRole(str, Enum):
    USER = "USER"
    ADMIN = "ADMIN"


class UserStatus(str, Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    DEACTIVATED = "DEACTIVATED"


class User(SQLAlchemyBaseUserTableUUID, Base):
    __tablename__ = "user"

    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    # Trial Registration / Engineer Profile fields (Tailored for BIM/Revit Engineers)
    job_title: Mapped[str | None] = mapped_column(String(100), nullable=True)
    revit_version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    use_case: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_trial_registered: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    trial_registered_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Single Active Device / Concurrency Enforcement
    active_device_fingerprint: Mapped[str | None] = mapped_column(
        String(64), nullable=True, index=True
    )
    active_device_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    active_device_last_seen: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole, native_enum=False),
        default=UserRole.USER,
        nullable=False,
    )
    status: Mapped[UserStatus] = mapped_column(
        SQLEnum(UserStatus, native_enum=False),
        default=UserStatus.ACTIVE,
        nullable=False,
    )
    normalized_email: Mapped[str | None] = mapped_column(
        String(320), index=True, nullable=True
    )
    google_subject: Mapped[str | None] = mapped_column(
        String(255), index=True, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    oauth_accounts: Mapped[list[OAuthAccount]] = relationship(
        "OAuthAccount", lazy="selectin"
    )

    @property
    def display_name(self) -> str:
        return self.name or self.email or "User"
