---
name: backend-architecture
description: Enterprise standard for architecting, building, auditing, and scaling production-grade FastAPI backend applications for any system. Covers Async SQLAlchemy 2.0, Pydantic v2, Dependency Injection with Annotated, OAuth2/JWT/RBAC auth, Alembic migrations, custom exception handling, structured logging, background tasks, Pytest async testing, and production Uvicorn/Docker.
argument-hint: "[architecture | api | database | auth | security | caching | testing | docker]"
license: MIT
metadata:
  author: antigravity
  version: "3.0.0"
---

# Universal FastAPI Enterprise Architecture Standard

Comprehensive, production-proven standard for building robust, scalable, and maintainable backend systems with **FastAPI**, **SQLAlchemy 2.0 (Async)**, **Alembic**, and **Pydantic v2**. Suitable for SaaS products, REST/GraphQL APIs, microservices, mobile backends, and AI/agent platforms.

---

## When to Use This Skill

Activate this skill when:
- Bootstrapping a new FastAPI application or microservice from scratch.
- Designing API routes, endpoint controllers, and Pydantic v2 DTO schemas.
- Implementing authentication (OAuth2, JWT access & refresh token rotation) and RBAC/permission route guards.
- Writing SQLAlchemy 2.0 async models, reusable mixins, and Alembic database migrations.
- Setting up type-safe dependency injection with `typing.Annotated` and `fastapi.Depends`.
- Implementing custom domain exceptions and centralized RFC 7807 error responses.
- Integrating Redis caching (Cache-Aside, Distributed Locks) and background workers (BackgroundTasks / Celery / ARQ).
- Writing async unit and integration tests with `pytest`, `pytest-asyncio`, and `httpx.AsyncClient`.
- Authoring production-ready multi-stage Dockerfiles and deployment manifests.
- Auditing any FastAPI codebase for anti-patterns, sync/blocking bottlenecks, or security issues.

---

## Reference Guides

- **FastAPI API Design & Envelopes**: [api-design-guide.md](references/api-design-guide.md)
- **FastAPI Security, OAuth2, JWT & RBAC**: [security-and-auth.md](references/security-and-auth.md)
- **SQLAlchemy 2.0 Async, Mixins & Alembic**: [database-and-migrations.md](references/database-and-migrations.md)
- **Structured Logging & Observability**: [logging-and-observability.md](references/logging-and-observability.md)
- **Redis Caching & Background Queues**: [caching-and-background-tasks.md](references/caching-and-background-tasks.md)
- **Pytest Asyncio & Testing Standards**: [testing-standards.md](references/testing-standards.md)
- **Production FastAPI Docker & Deployment**: [production-docker-patterns.md](references/production-docker-patterns.md)

---

## 1. Architectural Topologies

### Topology A: Layered Standard (Recommended for most applications)
```
backend/
├── app/
│   ├── api/                      # Presentation Layer (HTTP Routing & Endpoints)
│   │   ├── deps.py               # Centralized Dependency Injection aliases
│   │   └── v1/
│   │       ├── router.py         # Aggregated v1 APIRouter
│   │       └── endpoints/        # Route controllers (auth, users, items, etc.)
│   ├── core/                     # Application Kernel & Cross-Cutting Concerns
│   │   ├── config.py             # Pydantic BaseSettings environment validation
│   │   ├── security.py           # Password hashing (Argon2), JWT signing/verification
│   │   ├── dependencies.py       # Global auth/role dependencies (get_current_user)
│   │   ├── exceptions.py         # Custom AppException hierarchy & error handlers
│   │   └── logging.py            # Structured JSON logging configuration
│   ├── db/                       # Database Infrastructure Layer
│   │   ├── base.py               # Declarative Base & reusable Model Mixins
│   │   ├── session.py            # Async engine & async_sessionmaker
│   │   └── seed.py               # Initial data & master seeders
│   ├── models/                   # Domain Entities & SQLAlchemy 2.0 ORM Models
│   │   ├── user.py               # User model (extends SQLAlchemyBaseUserTableUUID)
│   │   ├── oauth.py              # Social OAuth accounts (extends SQLAlchemyBaseOAuthAccountTableUUID)
│   │   └── item.py
│   ├── schemas/                  # Contract / DTO Layer (Pydantic v2 Models)
│   │   ├── common.py             # ResponseEnvelope, PaginationParams, ErrorResponse
│   │   ├── user.py               # UserCreate, UserRead, UserUpdate
│   │   └── item.py
│   ├── services/                 # Application & Business Logic Layer (Use Cases)
│   │   ├── user_manager.py       # FastAPI-Users UserManager & lifecycle hooks
│   │   ├── user_service.py
│   │   └── item_service.py
│   ├── repositories/             # Optional: Data Access / Query Encapsulation
│   └── main.py                   # FastAPI app factory, lifespan manager & middlewares
├── migrations/                   # Alembic database migration scripts
│   ├── env.py                    # Async migration engine setup
│   └── versions/                 # Revision scripts
├── tests/                        # Pytest Test Suite
│   ├── conftest.py               # Shared async fixtures & test DB setup
│   ├── api/                      # Endpoint integration tests
│   └── services/                 # Business logic unit tests
├── alembic.ini                   # Alembic configuration
├── Dockerfile                    # Multi-stage production container
├── pyproject.toml                # Project metadata & dependencies
└── requirements.txt
```

### Topology B: Modular / Feature-First (Recommended for Large Domain-Rich Systems)
```
backend/
├── app/
│   ├── core/                     # Shared kernel (config, db session, security, exceptions)
│   ├── modules/
│   │   ├── auth/                 # Auth module (endpoints, services, schemas, models)
│   │   ├── users/                # Users module
│   │   ├── billing/              # Billing module
│   │   └── notifications/        # Notifications module
│   └── main.py                   # App factory aggregating all module routers
```

---

## 2. FastAPI Modern App Factory & Lifespan

Always manage startup and shutdown tasks using `@asynccontextmanager async def lifespan(app: FastAPI)`:

```python
# app/main.py
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import setup_logging
from app.db.session import engine

setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # ── Startup Phase ──
    # Initialize DB connections, warm caches, or start background schedulers
    yield
    # ── Shutdown Phase ──
    # Close connection pools cleanly
    await engine.dispose()

def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        debug=settings.debug,
        lifespan=lifespan,
        docs_url="/docs" if settings.enable_docs else None,
        redoc_url="/redoc" if settings.enable_docs else None,
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register centralized exception handlers
    register_exception_handlers(app)

    # Register API routers
    app.include_router(api_router, prefix="/api/v1")

    return app

app = create_application()
```

---

## 3. Type-Safe Dependency Injection (`Annotated` + `Depends`)

Centralize all dependency signatures in `app/api/deps.py` for clean, readable endpoint signatures:

```python
# app/api/deps.py
from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, settings
from app.core.dependencies import get_current_user, require_roles
from app.db.session import get_async_session
from app.models.user import User, UserRole

# Core Dependency Type Aliases
SessionDep = Annotated[AsyncSession, Depends(get_async_session)]
SettingsDep = Annotated[Settings, Depends(lambda: settings)]
CurrentUserDep = Annotated[User, Depends(get_current_user)]
AdminUserDep = Annotated[User, Depends(require_roles(UserRole.ADMIN))]
```

### Route Usage Example:
```python
# app/api/v1/endpoints/items.py
from fastapi import APIRouter, status
from app.api.deps import SessionDep, CurrentUserDep
from app.schemas.item import ItemCreate, ItemRead
from app.services.item_service import ItemService

router = APIRouter(prefix="/items", tags=["Items"])

@router.post("/", response_model=ItemRead, status_code=status.HTTP_201_CREATED)
async def create_item(
    payload: ItemCreate,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> ItemRead:
    service = ItemService(session)
    return await service.create_item(user_id=current_user.id, payload=payload)
```

---

## 4. Pydantic v2 Standard Schema Hierarchy

All schemas must follow the standard 4-tier schema convention:

```python
# app/schemas/user.py
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.models.user import UserRole

# 1. Base Schema (Shared attributes)
class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)

# 2. Create Schema (Required fields on write)
class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)
    role: UserRole = UserRole.USER

# 3. Update Schema (All fields optional)
class UserUpdate(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = Field(default=None, min_length=2, max_length=100)
    is_active: bool | None = None

# 4. Read Schema (Serialization & DB mapping)
class UserRead(UserBase):
    id: str
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

---

## 5. SQLAlchemy 2.0 Async & Reusable Mixins

### Base Model & Mixins (`app/db/base.py`)
```python
from datetime import datetime, timezone
import uuid
from sqlalchemy import DateTime, String, Boolean, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    """Declarative Base with automatic pluralized table naming."""
    @classmethod
    def __tablename__(cls) -> str:
        return cls.__name__.lower() + "s"

class UUIDPrimaryKeyMixin:
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )

class TimestampMixin:
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
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None, nullable=True)
```

### Entity Implementation:
```python
# app/models/user.py
import enum
from sqlalchemy import String, Enum
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin

class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"
    MANAGER = "manager"

class User(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.USER, nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
```

---

## 6. Centralized Error Handling (`AppException`)

```python
# app/core/exceptions.py
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

class AppException(Exception):
    """Base exception class for domain and application errors."""
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        code: str = "BAD_REQUEST",
        details: list | dict | None = None,
    ) -> None:
        self.message = message
        self.status_code = status_code
        self.code = code
        self.details = details
        super().__init__(message)

class NotFoundException(AppException):
    def __init__(self, message: str = "Resource not found", details: any = None) -> None:
        super().__init__(message=message, status_code=status.HTTP_404_NOT_FOUND, code="NOT_FOUND", details=details)

class UnauthorizedException(AppException):
    def __init__(self, message: str = "Unauthorized") -> None:
        super().__init__(message=message, status_code=status.HTTP_401_UNAUTHORIZED, code="UNAUTHORIZED")

class ForbiddenException(AppException):
    def __init__(self, message: str = "Forbidden") -> None:
        super().__init__(message=message, status_code=status.HTTP_403_FORBIDDEN, code="FORBIDDEN")

class ConflictException(AppException):
    def __init__(self, message: str = "Resource conflict") -> None:
        super().__init__(message=message, status_code=status.HTTP_409_CONFLICT, code="CONFLICT")

def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                    "traceId": getattr(request.state, "trace_id", None),
                },
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        details = [
            {"field": ".".join(str(loc) for loc in err["loc"]), "issue": err["msg"]}
            for err in exc.errors()
        ]
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "error": {
                    "code": "VALIDATION_FAILED",
                    "message": "Invalid request payload or parameters",
                    "details": details,
                },
            },
        )
```
