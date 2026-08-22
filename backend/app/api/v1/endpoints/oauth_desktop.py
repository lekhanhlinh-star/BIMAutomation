from datetime import datetime, timezone
import json
from typing import Annotated
from urllib.parse import quote, unquote
import uuid

from fastapi import APIRouter, Depends, Form, Header, HTTPException, Query, Request, status
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_async_session
from app.models.user import User
from app.schemas.desktop_auth import DesktopTokenRequest, DesktopTokenResponse
from app.services.audit_service import log_audit_event
from app.services.pkce_service import (
    ALLOWED_CLIENT_IDS,
    create_authorization_code,
    consume_authorization_code,
    validate_loopback_redirect_uri,
)
from app.services.token_service import (
    create_access_token,
    create_refresh_session,
    revoke_refresh_token,
    rotate_refresh_token,
)

router = APIRouter(tags=["desktop-oauth"])


@router.get("/oauth/authorize", response_class=HTMLResponse)
@router.get("/api/v1/oauth/authorize", response_class=HTMLResponse)
async def authorize(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_async_session)],
    response_type: str = Query("code", description="Must be 'code'"),
    client_id: str = Query(..., description="Must be 'revitapp-desktop'"),
    redirect_uri: str = Query(..., description="Loopback callback URL"),
    code_challenge: str = Query(..., description="PKCE SHA-256 challenge"),
    code_challenge_method: str = Query("S256", description="Must be 'S256'"),
    state: str = Query(..., description="CSRF state parameter"),
    user_id: uuid.UUID | None = Query(None, description="Optional pre-authenticated user ID"),
):
    """
    OAuth 2.0 Authorization Endpoint with PKCE.
    If authenticated & trial registered -> immediately issues code and redirects to Revit loopback.
    If authenticated & not trial registered -> renders seamless in-browser Trial Onboarding Form.
    Otherwise -> displays Google OAuth authorization prompt.
    """
    if response_type != "code":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="unsupported_response_type",
        )
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

    # 1. If user_id is provided and valid
    if user_id:
        user_res = await db.execute(select(User).where(User.id == user_id))
        user = user_res.scalar_one_or_none()
        if user and user.is_active:
            # If user already registered for trial / profile is complete -> Immediate Redirect
            if user.is_trial_registered:
                code = await create_authorization_code(
                    session=db,
                    user_id=user.id,
                    client_id=client_id,
                    redirect_uri=redirect_uri,
                    code_challenge=code_challenge,
                    code_challenge_method=code_challenge_method,
                )
                await log_audit_event(
                    session=db,
                    action="oauth_authorize_granted",
                    target_type="user",
                    target_id=str(user.id),
                    actor_user_id=user.id,
                    metadata={"client_id": client_id, "redirect_uri": redirect_uri},
                )
                return RedirectResponse(
                    url=f"{redirect_uri}?code={quote(code)}&state={quote(state)}",
                    status_code=status.HTTP_302_FOUND,
                )

            # User authenticated via Google but hasn't completed Trial Registration Onboarding
            return HTMLResponse(
                content=render_onboarding_form_html(
                    user=user,
                    client_id=client_id,
                    redirect_uri=redirect_uri,
                    code_challenge=code_challenge,
                    code_challenge_method=code_challenge_method,
                    state=state,
                ),
                status_code=status.HTTP_200_OK,
            )

    # 2. Render initial Google Login Consent Page
    return HTMLResponse(
        content=render_login_prompt_html(
            response_type=response_type,
            client_id=client_id,
            redirect_uri=redirect_uri,
            code_challenge=code_challenge,
            code_challenge_method=code_challenge_method,
            state=state,
        ),
        status_code=status.HTTP_200_OK,
    )


@router.post("/oauth/consent", response_class=HTMLResponse)
@router.post("/api/v1/oauth/consent", response_class=HTMLResponse)
async def submit_trial_consent(
    db: Annotated[AsyncSession, Depends(get_async_session)],
    user_id: uuid.UUID = Form(...),
    client_id: str = Form(...),
    redirect_uri: str = Form(...),
    code_challenge: str = Form(...),
    code_challenge_method: str = Form("S256"),
    state: str = Form(...),
    name: str = Form(...),
    phone: str = Form(...),
    job_title: str = Form(...),
    revit_version: str = Form(...),
    use_case: str = Form(...),
    terms_accepted: bool = Form(False),
):
    """
    Submits the in-browser trial onboarding form, completes registration,
    and immediately redirects to Revit loopback with authorization code.
    """
    if not terms_accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.",
        )
    if not validate_loopback_redirect_uri(redirect_uri):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invalid_redirect_uri",
        )

    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tài khoản không tồn tại hoặc đã bị khóa.",
        )

    now = datetime.now(timezone.utc)
    user.name = name.strip()
    user.phone = phone.strip()
    user.job_title = job_title.strip()
    user.revit_version = revit_version.strip()
    user.use_case = use_case.strip()
    user.is_trial_registered = True
    user.trial_registered_at = now
    await db.flush()

    # Generate PKCE Authorization Code
    code = await create_authorization_code(
        session=db,
        user_id=user.id,
        client_id=client_id,
        redirect_uri=redirect_uri,
        code_challenge=code_challenge,
        code_challenge_method=code_challenge_method,
    )

    await log_audit_event(
        session=db,
        action="user_trial_registered",
        target_type="user",
        target_id=str(user.id),
        actor_user_id=user.id,
        metadata={"job_title": job_title, "revit_version": revit_version, "phone": phone},
    )
    await log_audit_event(
        session=db,
        action="oauth_authorize_granted",
        target_type="user",
        target_id=str(user.id),
        actor_user_id=user.id,
        metadata={"client_id": client_id, "redirect_uri": redirect_uri},
    )

    # Redirect to Revit loopback listener
    return RedirectResponse(
        url=f"{redirect_uri}?code={quote(code)}&state={quote(state)}",
        status_code=status.HTTP_302_FOUND,
    )


@router.post("/oauth/token", response_model=DesktopTokenResponse)
@router.post("/api/v1/oauth/token", response_model=DesktopTokenResponse)
async def exchange_token(
    payload: DesktopTokenRequest,
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> DesktopTokenResponse:
    """
    OAuth 2.0 Token Endpoint.
    Supports authorization_code with PKCE verifier, and refresh_token with rotation.
    """
    if payload.grant_type == "authorization_code":
        if not payload.code or not payload.code_verifier or not payload.redirect_uri:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="invalid_request",
            )

        auth_record = await consume_authorization_code(
            session=db,
            code=payload.code,
            client_id=payload.client_id,
            redirect_uri=payload.redirect_uri,
            code_verifier=payload.code_verifier,
        )

        user_res = await db.execute(select(User).where(User.id == auth_record.user_id))
        user = user_res.scalar_one_or_none()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="invalid_grant",
            )

        # Issue tokens
        access_token = create_access_token(
            user_id=user.id,
            email=user.email,
            role=user.role.value,
        )
        raw_refresh_token, _ = await create_refresh_session(
            session=db,
            user_id=user.id,
        )

        await log_audit_event(
            session=db,
            action="oauth_token_issued",
            target_type="user",
            target_id=str(user.id),
            actor_user_id=user.id,
            metadata={"grant_type": "authorization_code"},
        )

        return DesktopTokenResponse(
            access_token=access_token,
            token_type="Bearer",
            expires_in=900,
            refresh_token=raw_refresh_token,
            scope="all",
        )

    elif payload.grant_type == "refresh_token":
        if not payload.refresh_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="invalid_request",
            )

        new_access_token, new_refresh_token, session_rec = await rotate_refresh_token(
            session=db,
            raw_refresh_token=payload.refresh_token,
        )

        await log_audit_event(
            session=db,
            action="oauth_token_rotated",
            target_type="user",
            target_id=str(session_rec.user_id),
            actor_user_id=session_rec.user_id,
            metadata={"grant_type": "refresh_token"},
        )

        return DesktopTokenResponse(
            access_token=new_access_token,
            token_type="Bearer",
            expires_in=900,
            refresh_token=new_refresh_token,
            scope="all",
        )

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="unsupported_grant_type",
    )


@router.post("/oauth/revoke")
@router.post("/api/v1/oauth/revoke")
async def revoke_token(
    db: Annotated[AsyncSession, Depends(get_async_session)],
    token: str = Form(..., description="Token to revoke"),
) -> dict[str, str]:
    """
    OAuth 2.0 Revocation Endpoint (RFC 7009).
    """
    await revoke_refresh_token(db, token)
    return {"status": "ok"}


def render_login_prompt_html(
    client_id: str,
    redirect_uri: str,
    code_challenge: str,
    code_challenge_method: str,
    state: str,
    response_type: str = "code",
) -> str:
    """Renders the initial Google login prompt for RevitAI desktop authorization."""
    return f"""<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xác thực RevitAI - BIMAutomation</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #090d16;
            color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }}
        .card {{
            background: rgba(15, 23, 42, 0.85);
            border: 1px solid rgba(56, 189, 248, 0.25);
            border-radius: 20px;
            padding: 36px;
            max-width: 440px;
            width: 100%;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
            text-align: center;
            backdrop-filter: blur(12px);
        }}
        .logo {{
            font-size: 26px;
            font-weight: 800;
            background: linear-gradient(135deg, #38bdf8, #818cf8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 8px;
        }}
        .badge {{
            display: inline-block;
            background: rgba(56, 189, 248, 0.1);
            color: #38bdf8;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 12px;
            border-radius: 9999px;
            border: 1px solid rgba(56, 189, 248, 0.3);
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }}
        h2 {{
            margin: 0 0 10px 0;
            font-size: 20px;
            font-weight: 700;
        }}
        p {{
            color: #94a3b8;
            font-size: 14px;
            margin-bottom: 28px;
            line-height: 1.6;
        }}
        .btn-google {{
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            background: #ffffff;
            color: #0f172a;
            font-weight: 700;
            font-size: 15px;
            padding: 14px 20px;
            border-radius: 12px;
            text-decoration: none;
            box-sizing: border-box;
            transition: all 0.2s;
            cursor: pointer;
            border: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }}
        .btn-google:hover {{
            background: #f1f5f9;
            transform: translateY(-1px);
        }}
        .footer {{
            margin-top: 24px;
            font-size: 12px;
            color: #64748b;
        }}
    </style>
</head>
<body>
    <div class="card">
        <div class="logo">BIMAutomation</div>
        <div class="badge">RevitAI Desktop Auth</div>
        <h2>Ủy quyền RevitAI Add-in</h2>
        <p>Đăng nhập bằng tài khoản Google để kích hoạt bản quyền hoặc 14 ngày dùng thử Full Suite trực tiếp trên Autodesk Revit.</p>
        <button class="btn-google" id="loginBtn" onclick="startGoogleAuth()">
            <svg id="btnSpinner" style="display: none; width: 20px; height: 20px; margin-right: 10px; animation: spin 1s linear infinite;" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="#0284c7" stroke-width="4" fill="none" opacity="0.25"></circle>
                <path fill="#0284c7" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <svg id="btnGoogleIcon" style="width: 20px; height: 20px; margin-right: 10px;" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span id="btnText">Tiếp tục với Google</span>
        </button>
        <div id="errorAlert" style="display: none; margin-top: 16px; padding: 12px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 10px; color: #fca5a5; font-size: 13px; text-align: left; line-height: 1.5;"></div>
        <div class="footer">
            Bảo mật PKCE SHA-256 • Tự động đóng sau khi hoàn tất
        </div>
    </div>

    <style>
        @keyframes spin {{
            0% {{ transform: rotate(0deg); }}
            100% {{ transform: rotate(360deg); }}
        }}
    </style>

    <script>
        async function startGoogleAuth() {{
            const btn = document.getElementById('loginBtn');
            const btnSpinner = document.getElementById('btnSpinner');
            const btnGoogleIcon = document.getElementById('btnGoogleIcon');
            const btnText = document.getElementById('btnText');
            const errorAlert = document.getElementById('errorAlert');

            // 1. Lưu desktop parameters vào sessionStorage
            const desktopParams = {{
                response_type: "{response_type}",
                client_id: "{client_id}",
                redirect_uri: "{redirect_uri}",
                code_challenge: "{code_challenge}",
                code_challenge_method: "{code_challenge_method}",
                state: "{state}"
            }};
            sessionStorage.setItem('pending_desktop_oauth', JSON.stringify(desktopParams));

            // 2. Disable nút và hiển thị trạng thái đang xử lý
            btn.disabled = true;
            btn.style.opacity = '0.75';
            btn.style.cursor = 'not-allowed';
            if (btnSpinner) btnSpinner.style.display = 'inline-block';
            if (btnGoogleIcon) btnGoogleIcon.style.display = 'none';
            if (btnText) btnText.textContent = 'Đang kết nối Google...';
            if (errorAlert) {{
                errorAlert.style.display = 'none';
                errorAlert.textContent = '';
            }}

            try {{
                // 3. Gọi endpoint API để lấy authorization_url
                const res = await fetch('/api/v1/auth/google/authorize', {{
                    method: 'GET',
                    headers: {{ 'Accept': 'application/json' }}
                }});

                if (!res.ok) {{
                    throw new Error('Máy chủ phản hồi mã lỗi HTTP ' + res.status);
                }}

                const data = await res.json();
                if (!data || !data.authorization_url) {{
                    throw new Error('Phản hồi không chứa đường dẫn xác thực Google.');
                }}

                // 4. Kiểm tra URL phải là HTTPS và thuộc accounts.google.com
                let authUrl;
                try {{
                    authUrl = new URL(data.authorization_url);
                }} catch (e) {{
                    throw new Error('Đường dẫn ủy quyền không đúng định dạng URL.');
                }}

                if (authUrl.protocol !== 'https:' || authUrl.hostname !== 'accounts.google.com') {{
                    throw new Error('Đường dẫn ủy quyền không an toàn hoặc không thuộc máy chủ Google hợp lệ.');
                }}

                // 5. Chuyển hướng an toàn
                window.location.assign(authUrl.href);

            }} catch (err) {{
                // 6. Hiển thị lỗi thân thiện và mở lại nút bấm
                console.error('Lỗi khởi tạo Google Auth:', err);
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
                if (btnSpinner) btnSpinner.style.display = 'none';
                if (btnGoogleIcon) btnGoogleIcon.style.display = 'inline-block';
                if (btnText) btnText.textContent = 'Tiếp tục với Google';
                if (errorAlert) {{
                    errorAlert.style.display = 'block';
                    errorAlert.textContent = 'Không thể kết nối đến dịch vụ xác thực Google (' + (err.message || 'Lỗi mạng') + '). Vui lòng thử lại sau.';
                }}
            }}
        }}
    </script>
</body>
</html>"""


def render_onboarding_form_html(
    user: User,
    client_id: str,
    redirect_uri: str,
    code_challenge: str,
    code_challenge_method: str,
    state: str,
) -> str:
    """Renders the in-browser trial onboarding form for individual BIM/Revit engineers."""
    return f"""<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đăng ký Dùng thử RevitAI - BIMAutomation</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #090d16;
            color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }}
        .card {{
            background: rgba(15, 23, 42, 0.95);
            border: 1px solid rgba(56, 189, 248, 0.3);
            border-radius: 20px;
            padding: 32px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(16px);
        }}
        .header {{
            text-align: center;
            margin-bottom: 24px;
        }}
        .logo {{
            font-size: 24px;
            font-weight: 800;
            background: linear-gradient(135deg, #38bdf8, #818cf8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }}
        h2 {{
            font-size: 18px;
            margin: 6px 0;
            color: #ffffff;
        }}
        p.subtitle {{
            color: #94a3b8;
            font-size: 13px;
            margin: 0;
        }}
        .form-group {{
            margin-bottom: 16px;
        }}
        label {{
            display: block;
            font-size: 12px;
            font-weight: 600;
            color: #cbd5e1;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }}
        .required {{
            color: #f87171;
        }}
        input, select {{
            width: 100%;
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 8px;
            padding: 10px 14px;
            color: #f8fafc;
            font-size: 14px;
            box-sizing: border-box;
            outline: none;
            transition: border-color 0.2s;
        }}
        input:focus, select:focus {{
            border-color: #38bdf8;
        }}
        input:read-only {{
            background: #0f172a;
            color: #64748b;
            cursor: not-allowed;
        }}
        .row {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }}
        .checkbox-group {{
            display: flex;
            align-items: flex-start;
            gap: 10px;
            margin: 20px 0;
            font-size: 13px;
            color: #94a3b8;
        }}
        .checkbox-group input {{
            width: 18px;
            height: 18px;
            margin-top: 2px;
            accent-color: #38bdf8;
            cursor: pointer;
        }}
        .btn-submit {{
            width: 100%;
            background: linear-gradient(135deg, #0284c7, #2563eb);
            color: #ffffff;
            font-weight: 700;
            font-size: 15px;
            padding: 12px;
            border-radius: 10px;
            border: none;
            cursor: pointer;
            transition: opacity 0.2s, transform 0.1s;
        }}
        .btn-submit:hover {{
            opacity: 0.95;
            transform: translateY(-1px);
        }}
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <div class="logo">BIMAutomation</div>
            <h2>Đăng Ký Dùng Thử 14 Ngày</h2>
            <p class="subtitle">Hoàn tất thông tin cá nhân để kích hoạt Full Suite trên Autodesk Revit</p>
        </div>

        <form action="/oauth/consent" method="POST">
            <input type="hidden" name="user_id" value="{user.id}">
            <input type="hidden" name="client_id" value="{client_id}">
            <input type="hidden" name="redirect_uri" value="{redirect_uri}">
            <input type="hidden" name="code_challenge" value="{code_challenge}">
            <input type="hidden" name="code_challenge_method" value="{code_challenge_method}">
            <input type="hidden" name="state" value="{state}">

            <div class="row">
                <div class="form-group">
                    <label>Họ và tên <span class="required">*</span></label>
                    <input type="text" name="name" value="{user.name or ''}" required placeholder="Nguyễn Văn A">
                </div>
                <div class="form-group">
                    <label>Email xác thực</label>
                    <input type="email" value="{user.email}" readonly>
                </div>
            </div>

            <div class="row">
                <div class="form-group">
                    <label>Số điện thoại / Zalo <span class="required">*</span></label>
                    <input type="tel" name="phone" value="{user.phone or ''}" required placeholder="0987654321">
                </div>
                <div class="form-group">
                    <label>Phiên bản Revit <span class="required">*</span></label>
                    <select name="revit_version" required>
                        <option value="2025" selected>Autodesk Revit 2025</option>
                        <option value="2026">Autodesk Revit 2026</option>
                        <option value="2024">Autodesk Revit 2024</option>
                        <option value="2023">Autodesk Revit 2023</option>
                        <option value="2027">Autodesk Revit 2027</option>
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label>Vị trí / Nghề nghiệp <span class="required">*</span></label>
                <select name="job_title" required>
                    <option value="Kỹ sư Kết cấu (Structural Engineer)">Kỹ sư Kết cấu (Structural Engineer)</option>
                    <option value="Kỹ sư MEP (MEP Engineer)">Kỹ sư MEP (MEP Engineer)</option>
                    <option value="Kiến trúc sư (Architect)">Kiến trúc sư (Architect)</option>
                    <option value="BIM Manager / BIM Coordinator">BIM Manager / BIM Coordinator</option>
                    <option value="BIM Modeler / Họa viên">BIM Modeler / Họa viên</option>
                    <option value="Sinh viên ngành Xây dựng / Kiến trúc">Sinh viên ngành Xây dựng / Kiến trúc</option>
                    <option value="Khác">Khác</option>
                </select>
            </div>

            <div class="form-group">
                <label>Nhu cầu sử dụng chính <span class="required">*</span></label>
                <select name="use_case" required>
                    <option value="Bố trí cốt thép tự động (Dầm, Cột, Móng, Vách)">Bố trí cốt thép tự động (Dầm, Cột, Móng, Vách)</option>
                    <option value="Dựng mô hình từ bản vẽ CAD">Dựng mô hình từ bản vẽ CAD</option>
                    <option value="Trợ lý AI MCP tự động hóa BIM">Trợ lý AI MCP tự động hóa BIM</option>
                    <option value="Bộ công cụ tổng hợp Full Suite">Bộ công cụ tổng hợp Full Suite</option>
                </select>
            </div>

            <div class="checkbox-group">
                <input type="checkbox" name="terms_accepted" id="terms" value="true" required>
                <label for="terms" style="text-transform: none; font-weight: normal; cursor: pointer;">
                    Tôi đồng ý với Quy định cấp quyền dùng thử 14 ngày trên thiết bị và Chính sách bảo mật dữ liệu của BIMAutomation.
                </label>
            </div>

            <button type="submit" class="btn-submit">
                Hoàn tất & Kích hoạt RevitAI
            </button>
        </form>
    </div>
</body>
</html>"""
