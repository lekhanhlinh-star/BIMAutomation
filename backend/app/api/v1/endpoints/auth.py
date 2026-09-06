from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi_users import BaseUserManager
from fastapi_users.router.common import ErrorCode
import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    auth_backend,
    current_active_user,
    fastapi_users,
    get_jwt_strategy,
    google_oauth_client,
)
from app.db.session import get_async_session
from app.models.user import User
from app.schemas.user import UserCreate, UserRead
from app.services.token_service import (
    REFRESH_TOKEN_LIFETIME_DAYS,
    create_refresh_session,
    revoke_refresh_token,
    rotate_refresh_session,
)
from app.services.user_manager import get_user_manager

router = APIRouter(prefix="/auth", tags=["auth"])

WEB_REFRESH_COOKIE = "bimautomation_web_refresh"
WEB_REFRESH_COOKIE_PATH = "/api/v1/auth/jwt"


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key=WEB_REFRESH_COOKIE,
        value=refresh_token,
        max_age=REFRESH_TOKEN_LIFETIME_DAYS * 24 * 60 * 60,
        httponly=True,
        secure=settings.environment.lower() == "production",
        samesite="lax",
        path=WEB_REFRESH_COOKIE_PATH,
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=WEB_REFRESH_COOKIE,
        httponly=True,
        secure=settings.environment.lower() == "production",
        samesite="lax",
        path=WEB_REFRESH_COOKIE_PATH,
    )


async def _issue_web_session(db: AsyncSession, user: User) -> tuple[str, str]:
    access_token = await get_jwt_strategy().write_token(user)
    refresh_token, _ = await create_refresh_session(
        session=db,
        user_id=user.id,
        client_type="web",
    )
    return access_token, refresh_token


@router.post("/jwt/login", name="auth:jwt.login")
async def web_login(
    request: Request,
    credentials: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[AsyncSession, Depends(get_async_session)],
    user_manager: Annotated[BaseUserManager, Depends(get_user_manager)],
    previous_refresh_token: Annotated[
        str | None, Cookie(alias=WEB_REFRESH_COOKIE)
    ] = None,
) -> JSONResponse:
    user = await user_manager.authenticate(credentials)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorCode.LOGIN_BAD_CREDENTIALS.value,
        )

    if previous_refresh_token:
        await revoke_refresh_token(db, previous_refresh_token)

    access_token, refresh_token = await _issue_web_session(db, user)
    response = JSONResponse(
        {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.web_jwt_lifetime_seconds,
        }
    )
    _set_refresh_cookie(response, refresh_token)
    await user_manager.on_after_login(user, request, response)
    return response


@router.post("/jwt/session", name="auth:jwt.session")
async def establish_web_session(
    db: Annotated[AsyncSession, Depends(get_async_session)],
    user: Annotated[User, Depends(current_active_user)],
    previous_refresh_token: Annotated[
        str | None, Cookie(alias=WEB_REFRESH_COOKIE)
    ] = None,
) -> JSONResponse:
    """Creates a refresh session after a successful social-OAuth login."""
    if previous_refresh_token:
        await revoke_refresh_token(db, previous_refresh_token)

    access_token, refresh_token = await _issue_web_session(db, user)
    response = JSONResponse(
        {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.web_jwt_lifetime_seconds,
        }
    )
    _set_refresh_cookie(response, refresh_token)
    return response


@router.post("/jwt/refresh", name="auth:jwt.refresh")
async def refresh_web_session(
    db: Annotated[AsyncSession, Depends(get_async_session)],
    refresh_token: Annotated[
        str | None, Cookie(alias=WEB_REFRESH_COOKIE)
    ] = None,
) -> JSONResponse:
    if not refresh_token:
        response = JSONResponse(
            {"detail": "invalid_refresh_token"},
            status_code=status.HTTP_401_UNAUTHORIZED,
        )
        _clear_refresh_cookie(response)
        return response

    try:
        new_refresh_token, _, user = await rotate_refresh_session(
            session=db,
            raw_refresh_token=refresh_token,
            expected_client_type="web",
        )
    except HTTPException:
        response = JSONResponse(
            {"detail": "invalid_refresh_token"},
            status_code=status.HTTP_401_UNAUTHORIZED,
        )
        _clear_refresh_cookie(response)
        return response

    access_token = await get_jwt_strategy().write_token(user)
    response = JSONResponse(
        {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.web_jwt_lifetime_seconds,
        }
    )
    _set_refresh_cookie(response, new_refresh_token)
    return response


@router.post("/jwt/logout", name="auth:jwt.logout", status_code=status.HTTP_204_NO_CONTENT)
async def web_logout(
    db: Annotated[AsyncSession, Depends(get_async_session)],
    refresh_token: Annotated[
        str | None, Cookie(alias=WEB_REFRESH_COOKIE)
    ] = None,
) -> Response:
    if refresh_token:
        await revoke_refresh_token(db, refresh_token)
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    _clear_refresh_cookie(response)
    return response

# /auth/register
router.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
)

# /auth/reset-password
router.include_router(
    fastapi_users.get_reset_password_router(),
    prefix="/reset-password",
)

# /auth/google/authorize & /auth/google/callback (fastapi-users standard routes)
# redirect_url is the backend callback URL that Google will call
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


# /auth/google/web-callback — Custom browser-friendly callback
# After Google auth, browser is redirected here with code & state
# We forward to fastapi-users internal callback, get the JWT, then
# redirect browser to the frontend SPA with the token in the URL hash.
@router.get("/google/web-callback", tags=["auth"], response_class=HTMLResponse)
async def google_web_callback(request: Request, code: str, state: str):
    """
    Browser-facing Google OAuth callback.
    Exchanges code for JWT via internal fastapi-users callback endpoint,
    then redirects browser to frontend with token in URL fragment (#).
    """
    frontend_origin = settings.frontend_origin
    internal_urls = [
        "http://127.0.0.1:8000/api/v1/auth/google/callback",
        f"http://localhost:{settings.port}/api/v1/auth/google/callback",
        "http://backend:8000/api/v1/auth/google/callback",
    ]

    access_token = None
    async with httpx.AsyncClient() as client:
        for url in internal_urls:
            try:
                resp = await client.get(
                    url,
                    params={"code": code, "state": state},
                    timeout=5.0
                )
                if resp.status_code == 200:
                    data = resp.json()
                    access_token = data.get("access_token")
                    if access_token:
                        break
            except Exception:
                continue

    if not access_token:
        error_url = f"{frontend_origin}/login?error=google_auth_failed"
        return HTMLResponse(content=f"""<!DOCTYPE html>
<html>
<head><title>BIMAutomation - Lỗi xác thực</title></head>
<body>
<script>window.location.href = "{error_url}";</script>
<p>Xác thực thất bại. Đang chuyển về trang đăng nhập...</p>
</body>
</html>""", status_code=200)

    # Redirect browser to frontend SPA with token in fragment
    redirect_url = f"{frontend_origin}/auth/google/callback#token={access_token}"
    return HTMLResponse(content=f"""<!DOCTYPE html>
<html>
<head><title>BIMAutomation - Đang xác thực...</title></head>
<body>
<script>
  window.location.href = "{redirect_url}";
</script>
<p>Đang chuyển hướng về BIMAutomation...</p>
</body>
</html>""")
