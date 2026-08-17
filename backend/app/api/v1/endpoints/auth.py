from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
import httpx

from app.core.config import settings
from app.core.security import auth_backend, fastapi_users, google_oauth_client
from app.schemas.user import UserCreate, UserRead

router = APIRouter(prefix="/auth", tags=["auth"])

# /auth/jwt/login & /auth/jwt/logout
router.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/jwt",
)

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
