from datetime import datetime, timezone
from typing import TYPE_CHECKING
import uuid

from sqlalchemy import DateTime, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.license import License


class Device(Base):
    __tablename__ = "devices"
    __table_args__ = (
        UniqueConstraint("license_id", "installation_id", name="uq_license_installation"),
        Index("ix_devices_license_revoked", "license_id", "revoked_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    license_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("licenses.id", ondelete="CASCADE"), index=True, nullable=False
    )
    installation_id: Mapped[str] = mapped_column(
        String(100), index=True, nullable=False
    )
    fingerprint_hash: Mapped[str] = mapped_column(String(64), nullable=False)
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
    first_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    license: Mapped["License"] = relationship("License", back_populates="devices")
