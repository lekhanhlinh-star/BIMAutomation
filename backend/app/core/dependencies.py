from typing import Annotated
import uuid

from fastapi import Depends, Header, HTTPException, status
import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_async_session
from app.models.user import User, UserRole


async def get_current_user_flexible(
    db: Annotated[AsyncSession, Depends(get_async_session)],
    authorization: Annotated[str | None, Header()] = None,
) -> User:
    """
    Unified authentication dependency.
    Accepts Bearer Token from Desktop PKCE JWT or standard Web token.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="authentication_required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split(" ", 1)[1].strip()

    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        user_id_str = payload.get("sub")
        token_role = payload.get("role")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="invalid_token",
            )
        user_id = uuid.UUID(str(user_id_str))
        res = await db.execute(select(User).where(User.id == user_id))
        user = res.scalar_one_or_none()
        if user and user.is_active:
            if token_role == "ADMIN":
                user.role = UserRole.ADMIN
            return user
    except Exception:
        pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="invalid_token",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_admin_user(
    user: Annotated[User, Depends(get_current_user_flexible)],
) -> User:
    """
    Ensures the user has ADMIN role.
    """
    if user.role != UserRole.ADMIN and not getattr(user, "is_superuser", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Admin privileges required",
        )
    return user
