from datetime import datetime, timezone
from typing import Any
import uuid

from sqlalchemy import Boolean, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Release(Base):
    __tablename__ = "releases"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    version: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    download_url: Mapped[str] = mapped_column(String(500), nullable=False)
    release_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    minimum_revit_version: Mapped[int | None] = mapped_column(Integer, nullable=True, default=2022)
    maximum_revit_version: Mapped[int | None] = mapped_column(Integer, nullable=True, default=2027)
    file_size_label: Mapped[str | None] = mapped_column(String(50), nullable=True, default="71.4 MB")
    sha256_hash: Mapped[str | None] = mapped_column(String(100), nullable=True)
    packages: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    released_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), nullable=False
    )
