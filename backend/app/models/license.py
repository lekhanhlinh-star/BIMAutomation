from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING
import uuid

from sqlalchemy import Enum as SQLEnum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.order import Order
    from app.models.plan import Plan
    from app.models.user import User


class LicenseStatus(str, Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    SUSPENDED = "SUSPENDED"
    REVOKED = "REVOKED"


class License(Base):
    __tablename__ = "licenses"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    license_key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("user.id", ondelete="CASCADE"), nullable=False
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False
    )
    plan_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("plans.id", ondelete="RESTRICT"), nullable=False
    )
    device_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[LicenseStatus] = mapped_column(
        SQLEnum(LicenseStatus, native_enum=False),
        default=LicenseStatus.PENDING,
        nullable=False,
    )
    activated_at: Mapped[datetime | None] = mapped_column(nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(nullable=True)
    last_checked_at: Mapped[datetime | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), nullable=False
    )

    user: Mapped["User"] = relationship("User")
    order: Mapped["Order"] = relationship("Order")
    plan: Mapped["Plan"] = relationship("Plan")
