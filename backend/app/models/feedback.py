from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING
import uuid

from sqlalchemy import Enum as SQLEnum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class FeedbackType(str, Enum):
    FEATURE = "FEATURE"
    IMPROVEMENT = "IMPROVEMENT"
    BUG = "BUG"
    OTHER = "OTHER"


class FeedbackStatus(str, Enum):
    NEW = "NEW"
    REVIEWING = "REVIEWING"
    PLANNED = "PLANNED"
    DEVELOPING = "DEVELOPING"
    DONE = "DONE"
    REJECTED = "REJECTED"


class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("user.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[FeedbackType] = mapped_column(
        SQLEnum(FeedbackType, native_enum=False),
        default=FeedbackType.FEATURE,
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[FeedbackStatus] = mapped_column(
        SQLEnum(FeedbackStatus, native_enum=False),
        default=FeedbackStatus.NEW,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user: Mapped["User | None"] = relationship("User")
