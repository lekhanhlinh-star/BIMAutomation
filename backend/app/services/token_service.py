from datetime import datetime, timedelta, timezone
import hashlib
import secrets
from typing import Any
import uuid

from fastapi import HTTPException, status
import jwt
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.device import Device
from app.models.refresh_session import RefreshSession
from app.models.user import User

ACCESS_TOKEN_LIFETIME_MINUTES = 15
REFRESH_TOKEN_LIFETIME_DAYS = 60
JWT_ALGORITHM = "HS256"
JWT_ISSUER = "bimautomation"
JWT_AUDIENCE = "revitapp"


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_access_token(
    user_id: uuid.UUID,
    email: str,
    role: str = "USER",
    device_id: uuid.UUID | None = None,
) -> str:
    """
    Creates a signed, short-lived JWT access token (15 minutes).
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=ACCESS_TOKEN_LIFETIME_MINUTES)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "device_id": str(device_id) if device_id else None,
        "iss": JWT_ISSUER,
        "aud": JWT_AUDIENCE,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=JWT_ALGORITHM)


def verify_access_token(token: str) -> dict[str, Any]:
    """
    Verifies signature, issuer, audience, and expiration of JWT access token.
    """
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[JWT_ALGORITHM],
            audience=JWT_AUDIENCE,
            issuer=JWT_ISSUER,
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid_token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid_token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def create_refresh_session(
    session: AsyncSession,
    user_id: uuid.UUID,
    device_id: uuid.UUID | None = None,
    family_id: str | None = None,
    rotated_from_id: uuid.UUID | None = None,
) -> tuple[str, RefreshSession]:
    """
    Creates a new refresh session with cryptographic token and SHA-256 hash.
    """
    raw_token = secrets.token_urlsafe(48)
    token_h = hash_token(raw_token)
    fam_id = family_id or str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=REFRESH_TOKEN_LIFETIME_DAYS)

    refresh_session_record = RefreshSession(
        user_id=user_id,
        device_id=device_id,
        family_id=fam_id,
        token_hash=token_h,
        expires_at=expires_at,
        rotated_from_id=rotated_from_id,
        created_at=now,
    )
    session.add(refresh_session_record)
    await session.commit()
    await session.refresh(refresh_session_record)
    return raw_token, refresh_session_record


async def rotate_refresh_token(
    session: AsyncSession,
    raw_refresh_token: str,
) -> tuple[str, str, RefreshSession]:
    """
    Rotates a refresh token.
    - If valid: old token revoked, new token issued in same family.
    - If reuse of already-revoked token detected: REVOKES ENTIRE FAMILY!
    """
    token_h = hash_token(raw_refresh_token)
    result = await session.execute(
        select(RefreshSession).where(RefreshSession.token_hash == token_h)
    )
    current_session = result.scalar_one_or_none()

    if not current_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invalid_grant",
        )

    # Detect Token Reuse
    if current_session.revoked_at is not None:
        # Compromised! Revoke entire family
        await session.execute(
            update(RefreshSession)
            .where(RefreshSession.family_id == current_session.family_id)
            .values(revoked_at=datetime.now(timezone.utc))
        )
        await session.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invalid_grant",
        )

    now = datetime.now(timezone.utc)
    expires_at = current_session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < now:
        current_session.revoked_at = now
        await session.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invalid_grant",
        )

    # Fetch user
    user_res = await session.execute(
        select(User).where(User.id == current_session.user_id)
    )
    user = user_res.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid_grant",
        )

    # Revoke current token
    current_session.revoked_at = now
    current_session.last_used_at = now

    # Issue new token in same family
    new_raw_token, new_session = await create_refresh_session(
        session=session,
        user_id=user.id,
        device_id=current_session.device_id,
        family_id=current_session.family_id,
        rotated_from_id=current_session.id,
    )

    new_access_token = create_access_token(
        user_id=user.id,
        email=user.email,
        role=user.role.value,
        device_id=current_session.device_id,
    )

    return new_access_token, new_raw_token, new_session


async def revoke_refresh_token(
    session: AsyncSession,
    raw_token: str,
) -> bool:
    """
    Revokes a refresh token session.
    """
    token_h = hash_token(raw_token)
    result = await session.execute(
        select(RefreshSession).where(RefreshSession.token_hash == token_h)
    )
    refresh_session_record = result.scalar_one_or_none()
    if refresh_session_record:
        refresh_session_record.revoked_at = datetime.now(timezone.utc)
        await session.commit()
        return True
    return False
