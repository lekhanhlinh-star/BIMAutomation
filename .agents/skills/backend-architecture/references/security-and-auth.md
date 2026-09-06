# FastAPI Security, OAuth2, FastAPI-Users & RBAC

## 1. FastAPI-Users Enterprise Integration (Recommended)

`fastapi-users` is the production standard for handling registration, login, email verification, password reset, and social OAuth.

### Step 1: Database Models (`app/models/user.py` & `app/models/oauth.py`)

```python
# app/models/oauth.py
import uuid
from fastapi_users.db import SQLAlchemyBaseOAuthAccountTableUUID
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class OAuthAccount(SQLAlchemyBaseOAuthAccountTableUUID, Base):
    __tablename__ = "oauth_accounts"
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
```

```python
# app/models/user.py
import enum
from datetime import datetime, timezone
import uuid
from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from sqlalchemy import DateTime, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.oauth import OAuthAccount

class UserRole(str, enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"

class User(SQLAlchemyBaseUserTableUUID, Base):
    __tablename__ = "users"

    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.USER, nullable=False)
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

    # Social OAuth Accounts Relationship
    oauth_accounts: Mapped[list[OAuthAccount]] = relationship("OAuthAccount", lazy="selectin", cascade="all, delete-orphan")
```

---

### Step 2: Custom User Manager & Lifecycle Hooks (`app/services/user_manager.py`)

```python
# app/services/user_manager.py
import logging
from typing import Annotated
import uuid
from collections.abc import AsyncGenerator
from fastapi import Depends, Request
from fastapi_users import BaseUserManager, UUIDIDMixin
from fastapi_users.exceptions import InvalidPasswordException
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_async_session
from app.models.oauth import OAuthAccount
from app.models.user import User

logger = logging.getLogger(__name__)

class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = settings.secret_key
    verification_token_secret = settings.secret_key

    async def validate_password(self, password: str, user: User | None = None) -> None:
        if len(password) < 8:
            raise InvalidPasswordException(reason="Password must be at least 8 characters long.")

    async def on_after_register(self, user: User, request: Request | None = None) -> None:
        logger.info(f"User registered: {user.id} ({user.email})")

    async def on_after_forgot_password(self, user: User, token: str, request: Request | None = None) -> None:
        reset_url = f"{settings.frontend_url}/reset-password?token={token}"
        logger.info(f"Password reset requested for {user.email}: {reset_url}")
        # Dispatch email asynchronously via BackgroundTasks or worker

    async def on_after_request_verify(self, user: User, token: str, request: Request | None = None) -> None:
        verify_url = f"{settings.frontend_url}/verify-email?token={token}"
        logger.info(f"Verification requested for {user.email}: {verify_url}")

async def get_user_db(
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> AsyncGenerator[SQLAlchemyUserDatabase, None]:
    yield SQLAlchemyUserDatabase(session, User, OAuthAccount)

async def get_user_manager(
    user_db: Annotated[SQLAlchemyUserDatabase, Depends(get_user_db)],
) -> AsyncGenerator[UserManager, None]:
    yield UserManager(user_db)
```

---

### Step 3: Social OAuth Client & FastAPIUsers Setup (`app/core/security.py`)

```python
# app/core/security.py
from typing import Any, cast
import uuid
from fastapi_users import FastAPIUsers
from fastapi_users.authentication import AuthenticationBackend, BearerTransport, JWTStrategy
from httpx_oauth.clients.google import GoogleOAuth2
from httpx_oauth.exceptions import GetProfileError, GetIdEmailError

from app.core.config import settings
from app.models.user import User
from app.services.user_manager import get_user_manager

class CustomGoogleOAuth2(GoogleOAuth2):
    """
    Standard OpenID Connect userinfo client.
    Avoids HTTP 403 Forbidden errors when Google People API is disabled on GCP.
    """
    async def get_profile(self, token: str) -> dict[str, Any]:
        async with self.get_httpx_client() as client:
            response = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={**self.request_headers, "Authorization": f"Bearer {token}"},
            )
            if response.status_code >= 400:
                raise GetProfileError(response=response)
            return cast(dict[str, Any], response.json())

    async def get_id_email(self, token: str) -> tuple[str, str | None]:
        try:
            profile = await self.get_profile(token)
        except GetProfileError as e:
            raise GetIdEmailError(response=e.response) from e
        return profile.get("sub", ""), profile.get("email")

bearer_transport = BearerTransport(tokenUrl="api/v1/auth/jwt/login")

def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=settings.secret_key, lifetime_seconds=settings.access_token_expire_seconds)

auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)

google_oauth_client = CustomGoogleOAuth2(
    client_id=settings.google_client_id,
    client_secret=settings.google_client_secret,
)

fastapi_users = FastAPIUsers[User, uuid.UUID](
    get_user_manager,
    [auth_backend],
)

current_active_user = fastapi_users.current_user(active=True)
current_superuser = fastapi_users.current_user(active=True, superuser=True)
```

---

### Step 4: Auth Routing & Web SPA Callback (`app/api/v1/endpoints/auth.py`)

```python
# app/api/v1/endpoints/auth.py
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
import httpx

from app.core.config import settings
from app.core.security import auth_backend, fastapi_users, google_oauth_client
from app.schemas.user import UserCreate, UserRead

router = APIRouter(prefix="/auth", tags=["Auth"])

# /auth/jwt/login & /auth/jwt/logout
router.include_router(fastapi_users.get_auth_router(auth_backend), prefix="/jwt")

# /auth/register
router.include_router(fastapi_users.get_register_router(UserRead, UserCreate))

# /auth/reset-password
router.include_router(fastapi_users.get_reset_password_router(), prefix="/reset-password")

# /auth/google/authorize & /auth/google/callback
router.include_router(
    fastapi_users.get_oauth_router(
        google_oauth_client,
        auth_backend,
        settings.secret_key,
        associate_by_email=True,
        is_verified_by_default=True,
        redirect_url=settings.google_redirect_uri,
    ),
    prefix="/google",
)

# SPA Web Callback: Exchanges code for token and redirects to frontend with fragment (#token=...)
@router.get("/google/web-callback", response_class=HTMLResponse)
async def google_web_callback(request: Request, code: str, state: str):
    callback_url = f"{settings.backend_url}/api/v1/auth/google/callback"
    access_token = None

    async with httpx.AsyncClient() as client:
        resp = await client.get(callback_url, params={"code": code, "state": state})
        if resp.status_code == 200:
            access_token = resp.json().get("access_token")

    if not access_token:
        error_url = f"{settings.frontend_url}/login?error=oauth_failed"
        return HTMLResponse(content=f'<script>window.location.href="{error_url}";</script>')

    redirect_url = f"{settings.frontend_url}/auth/callback#token={access_token}"
    return HTMLResponse(content=f'<script>window.location.href="{redirect_url}";</script>')
```

---

## 2. Role-Based Access Control (RBAC) Dependency Factory

```python
# app/core/dependencies.py
from collections.abc import Callable
from typing import Annotated
from fastapi import Depends, HTTPException, status
from app.core.security import current_active_user
from app.models.user import User, UserRole

def require_roles(*allowed_roles: UserRole) -> Callable[[User], User]:
    """Dependency factory checking user roles."""
    async def role_checker(current_user: Annotated[User, Depends(current_active_user)]) -> User:
        if current_user.role not in allowed_roles and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Requires one of {[r.value for r in allowed_roles]}",
            )
        return current_user
    return role_checker
```

### Usage in Endpoints:
```python
# app/api/v1/endpoints/admin.py
from fastapi import APIRouter, Depends
from app.core.dependencies import require_roles
from app.models.user import User, UserRole

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/metrics", dependencies=[Depends(require_roles(UserRole.ADMIN))])
async def get_metrics():
    return {"status": "ok", "active_nodes": 42}
```
