from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING
import uuid

from sqlalchemy import DateTime, Enum as SQLEnum, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class DeviceTrialStatus(str, Enum):
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    BLOCKED = "BLOCKED"


class DeviceTrial(Base):
    __tablename__ = "device_trials"
    __table_args__ = (
        Index("ix_device_trials_status_exp", "status", "trial_expires_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    fingerprint_hash: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, nullable=False
    )
    display_name: Mapped[str] = mapped_column(
        String(255), default="Desktop Device", nullable=False
    )
    platform: Mapped[str] = mapped_column(
        String(50), default="windows", nullable=False
    )
    revit_version: Mapped[str] = mapped_column(
        String(50), default="", nullable=False
    )
    app_version: Mapped[str] = mapped_column(
        String(50), default="", nullable=False
    )
    first_trial_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    trial_expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        index=True,
        nullable=False,
    )
    initial_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("user.id", ondelete="SET NULL"), nullable=True
    )
    last_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("user.id", ondelete="SET NULL"), nullable=True
    )
    # Individual hardware components for unbreakable anti-abuse identification
    bios_uuid: Mapped[str | None] = mapped_column(
        String(100), index=True, nullable=True
    )
    cpu_id: Mapped[str | None] = mapped_column(
        String(100), index=True, nullable=True
    )
    motherboard_serial: Mapped[str | None] = mapped_column(
        String(100), index=True, nullable=True
    )
    disk_serial: Mapped[str | None] = mapped_column(
        String(100), index=True, nullable=True
    )
    mac_address: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    tamper_flags: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    status: Mapped[DeviceTrialStatus] = mapped_column(
        SQLEnum(DeviceTrialStatus, native_enum=False),
        default=DeviceTrialStatus.ACTIVE,
        nullable=False,
    )
    reset_count: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
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

    initial_user: Mapped["User | None"] = relationship(
        "User", foreign_keys=[initial_user_id], lazy="selectin"
    )
    last_user: Mapped["User | None"] = relationship(
        "User", foreign_keys=[last_user_id], lazy="selectin"
    )
