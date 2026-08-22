import base64
from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import secrets
from urllib.parse import urlparse
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auth_code import AuthorizationCode
from app.models.user import User

ALLOWED_CLIENT_IDS = {"revitapp-desktop"}
AUTH_CODE_LIFETIME_SECONDS = 120  # Max 2 minutes


def hash_token(token: str) -> str:
    """Computes SHA-256 hex digest of a token/code."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def validate_loopback_redirect_uri(redirect_uri: str) -> bool:
    """
    Validates that the redirect URI is a valid loopback URI (RFC 8252).
    Allows http://127.0.0.1:{port}/callback or http://localhost:{port}/callback.
    """
    try:
        parsed = urlparse(redirect_uri)
        if parsed.scheme != "http":
            return False
        if parsed.hostname not in ("127.0.0.1", "localhost"):
            return False
        if not parsed.port or parsed.port <= 0 or parsed.port > 65535:
            return False
        if parsed.path.rstrip("/") != "/callback":
            return False
        return True
    except Exception:
        return False


def verify_pkce_challenge(
    code_verifier: str, code_challenge: str, method: str = "S256"
) -> bool:
    """
    Verifies code_verifier against code_challenge using S256 PKCE (RFC 7636).
    """
    if method != "S256":
        return False
    if not (43 <= len(code_verifier) <= 128):
        return False

    computed_digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
    computed_challenge = (
        base64.urlsafe_b64encode(computed_digest).decode("ascii").rstrip("=")
    )
    expected_challenge = code_challenge.rstrip("=")
    return hmac.compare_digest(computed_challenge, expected_challenge)


async def create_authorization_code(
    session: AsyncSession,
    user_id: uuid.UUID,
    client_id: str,
    redirect_uri: str,
    code_challenge: str,
    code_challenge_method: str = "S256",
) -> str:
    """
    Generates a secure authorization code and stores its SHA-256 hash in DB.
    """
    if client_id not in ALLOWED_CLIENT_IDS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invalid_client",
        )
    if not validate_loopback_redirect_uri(redirect_uri):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invalid_redirect_uri",
        )
    if code_challenge_method != "S256":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="unsupported_challenge_method",
        )

    code = secrets.token_urlsafe(32)
    code_h = hash_token(code)
    expires_at = datetime.now(timezone.utc) + timedelta(
        seconds=AUTH_CODE_LIFETIME_SECONDS
    )

    auth_code_record = AuthorizationCode(
        code_hash=code_h,
        user_id=user_id,
        client_id=client_id,
        redirect_uri=redirect_uri,
        code_challenge=code_challenge,
        code_challenge_method=code_challenge_method,
        expires_at=expires_at,
    )
    session.add(auth_code_record)
    await session.commit()
    return code


async def consume_authorization_code(
    session: AsyncSession,
    code: str,
    client_id: str,
    redirect_uri: str,
    code_verifier: str,
) -> AuthorizationCode:
    """
    Validates, verifies PKCE challenge, and consumes authorization code.
    Enforces single-use and expiration.
    """
    code_h = hash_token(code)
    result = await session.execute(
        select(AuthorizationCode).where(AuthorizationCode.code_hash == code_h)
    )
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invalid_grant",
        )

    # Check if already consumed
    if record.consumed_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invalid_grant",
        )

    # Mark as consumed immediately to enforce single-use
    now = datetime.now(timezone.utc)
    record.consumed_at = now
    await session.commit()

    # Check expiration
    expires_at = record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invalid_grant",
        )

    # Check client_id and redirect_uri match
    if record.client_id != client_id or record.redirect_uri != redirect_uri:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invalid_grant",
        )

    # Check PKCE verifier
    if not verify_pkce_challenge(
        code_verifier, record.code_challenge, record.code_challenge_method
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invalid_grant",
        )

    return record
