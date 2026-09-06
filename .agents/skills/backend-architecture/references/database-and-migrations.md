# SQLAlchemy 2.0 Async, Mixins & Alembic Database Migrations

## 1. Declarative Base & Reusable Model Mixins

```python
# app/db/base.py
from datetime import datetime, timezone
import uuid
from sqlalchemy import DateTime, String, Boolean, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    """Base model with automatic table naming."""
    @classmethod
    def __tablename__(cls) -> str:
        return cls.__name__.lower() + "s"

class UUIDPrimaryKeyMixin:
    """Provides a UUID string primary key."""
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )

class IntegerPrimaryKeyMixin:
    """Provides an auto-incrementing integer primary key."""
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, index=True)

class TimestampMixin:
    """Provides timezone-aware UTC timestamps."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

class SoftDeleteMixin:
    """Provides soft-delete capabilities."""
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None, nullable=True)
```

---

## 2. Model Declaration Example

```python
# app/models/item.py
from sqlalchemy import String, Text, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin

class Item(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    title: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    owner: Mapped["User"] = relationship("User", back_populates="items")
```

---

## 3. Universal Async Alembic Setup

### Step 1: Initialize Async Alembic
```bash
alembic init -t async migrations
```

### Step 2: Configure `migrations/env.py`
```python
import asyncio
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context

# 1. Import application settings & declarative Base
from app.core.config import settings
from app.db.base import Base

# 2. IMPORTANT: Import ALL model modules so Base.metadata has all table definitions!
import app.models.user  # noqa: F401
import app.models.item  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

config.set_main_option("sqlalchemy.url", settings.database_url)
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,  # SQLite compatibility
    )
    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        render_as_batch=True,
    )
    with context.begin_transaction():
        context.run_migrations()

async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()

def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

---

## 4. Preventing N+1 Queries with Eager Loading

SQLAlchemy 2.0 Async requires explicit relationship loading:

```python
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload
from app.models.user import User
from app.models.item import Item

# 1. selectinload (Preferred for 1-to-Many and Many-to-Many collections)
stmt = (
    select(User)
    .where(User.is_deleted.is_(False))
    .options(selectinload(User.items))
)
result = await session.execute(stmt)
users = result.scalars().all()

# 2. joinedload (Preferred for Many-to-1 or 1-to-1 relationships via SQL JOIN)
stmt = (
    select(Item)
    .options(joinedload(Item.owner))
)
result = await session.execute(stmt)
items = result.scalars().all()
```
