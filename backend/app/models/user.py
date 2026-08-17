from enum import Enum
import uuid

from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from sqlalchemy import Enum as SQLEnum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.oauth import OAuthAccount


class UserRole(str, Enum):
    USER = "USER"
    ADMIN = "ADMIN"


class User(SQLAlchemyBaseUserTableUUID, Base):
    __tablename__ = "user"

    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole, native_enum=False),
        default=UserRole.USER,
        nullable=False,
    )
    oauth_accounts: Mapped[list[OAuthAccount]] = relationship(
        "OAuthAccount", lazy="joined"
    )


