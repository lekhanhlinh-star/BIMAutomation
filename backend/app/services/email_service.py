import asyncio
import logging
from pathlib import Path
import smtplib
from email.message import EmailMessage
from email.utils import formataddr

from app.core.config import Settings, settings as global_settings

logger = logging.getLogger(__name__)


def get_effective_sender(settings: Settings) -> str:
    if settings.smtp_sender:
        return settings.smtp_sender
    if settings.smtp_username:
        name = settings.smtp_from_name or "BIM Automation"
        return formataddr((name, settings.smtp_username))
    return "support@bimautomation.solutions"


def get_logo_bytes() -> bytes | None:
    # 1. Primary backend app assets location
    primary = Path(__file__).resolve().parent.parent / "assets" / "logo.png"
    if primary.exists():
        try:
            return primary.read_bytes()
        except Exception:
            pass

    # 2. Frontend public assets fallback
    fallback = Path(__file__).resolve().parent.parent.parent.parent / "frontend" / "public" / "assets" / "brand" / "bimautomation-mark.png"
    if fallback.exists():
        try:
            return fallback.read_bytes()
        except Exception:
            pass

    # 3. Root assets fallback
    root_fallback = Path(__file__).resolve().parent.parent.parent.parent / "assets" / "brand" / "bimautomation-mark.png"
    if root_fallback.exists():
        try:
            return root_fallback.read_bytes()
        except Exception:
            pass

    return None


async def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: str | None = None,
    settings: Settings | None = None,
) -> bool:
    s = settings or global_settings
    if not s.smtp_host or not s.smtp_username:
        logger.warning("Email sending skipped because SMTP host or username is not configured.")
        return False

    sender = get_effective_sender(s)

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = sender
    message["To"] = to_email

    if text_content:
        message.set_content(text_content)
    else:
        # Simple plain-text fallback
        message.set_content(subject)

    message.add_alternative(html_content, subtype="html")

    # Embed inline brand logo with CID so all email clients (Gmail, Outlook) render it offline
    logo_data = get_logo_bytes()
    if logo_data:
        try:
            html_part = message.get_body(preferencelist=("html",))
            if html_part:
                html_part.add_related(logo_data, maintype="image", subtype="png", cid="<brand_logo>")
        except Exception as e:
            logger.warning(f"Could not attach inline brand logo: {e}")

    def _send_sync() -> None:
        is_ssl = (s.smtp_port == 465) or (s.smtp_port != 587 and getattr(s, "smtp_use_ssl", False) and not getattr(s, "smtp_use_tls", False))
        
        if is_ssl:
            with smtplib.SMTP_SSL(s.smtp_host, s.smtp_port, timeout=15) as smtp:
                if s.smtp_username and s.smtp_password:
                    smtp.login(s.smtp_username, s.smtp_password)
                smtp.send_message(message)
        else:
            with smtplib.SMTP(s.smtp_host, s.smtp_port, timeout=15) as smtp:
                if getattr(s, "smtp_use_tls", True):
                    smtp.starttls()
                if s.smtp_username and s.smtp_password:
                    smtp.login(s.smtp_username, s.smtp_password)
                smtp.send_message(message)

    try:
        await asyncio.to_thread(_send_sync)
        logger.info(f"Email successfully sent to {to_email} with subject: '{subject}'")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


async def send_password_reset_email(email: str, reset_url: str, settings: Settings | None = None) -> bool:
    s = settings or global_settings
    subject = "Đặt lại mật khẩu BIMAutomation"
    text_body = (
        "Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản BIMAutomation.\n"
        f"Nhấp vào liên kết sau để hoàn tất: {reset_url}\n\n"
        "Nếu bạn không yêu cầu hành động này, vui lòng bỏ qua email này."
    )
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1120; color: #e2e8f0; margin: 0; padding: 40px 20px;">
      <div style="max-width: 560px; margin: 0 auto; background: #1e293b; border-radius: 14px; border: 1px solid #334155; padding: 36px 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.4);">
        <div style="text-align: center; margin-bottom: 26px;">
          <img src="cid:brand_logo" alt="BIMAutomation Logo" width="64" height="64" style="display: block; margin: 0 auto 12px auto; border-radius: 14px; box-shadow: 0 4px 14px rgba(56, 189, 248, 0.35); border: 1px solid rgba(56, 189, 248, 0.4);" />
          <h1 style="color: #38bdf8; font-size: 24px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">BIMAutomation</h1>
          <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Nền tảng Tự động hóa Revit BIM &amp; AI Rebar Engine</p>
        </div>
        <div style="border-top: 1px solid #334155; padding-top: 22px; margin-bottom: 24px;">
          <h2 style="color: #f8fafc; font-size: 18px; margin: 0 0 14px 0;">Yêu cầu Đặt lại Mật khẩu</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 22px 0;">
            Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>{email}</strong>. Vui lòng bấm vào nút bên dưới để tạo mật khẩu mới:
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="{reset_url}" style="background: #2563eb; color: #ffffff; text-decoration: none; padding: 13px 30px; border-radius: 8px; font-size: 15px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(37,99,235,0.4);">
              Đặt lại mật khẩu ngay
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0;">
            Liên kết này chỉ có hiệu lực trong 1 giờ. Nếu bạn không yêu cầu thao tác này, bạn có thể yên tâm bỏ qua email này.
          </p>
        </div>
        <div style="border-top: 1px solid #334155; padding-top: 18px; text-align: center;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">
            Hỗ trợ kỹ thuật: <a href="mailto:support@bimautomation.solutions" style="color: #38bdf8; text-decoration: none; font-weight: bold;">support@bimautomation.solutions</a> · Hotline: 0799 660 737
          </p>
        </div>
      </div>
    </body>
    </html>
    """
    return await send_email(to_email=email, subject=subject, html_content=html_body, text_content=text_body, settings=s)


async def send_order_success_email(
    email: str,
    order_code: str,
    plan_name: str,
    amount: int,
    license_key: str | None = None,
    settings: Settings | None = None,
) -> bool:
    s = settings or global_settings
    subject = f"Xác nhận thanh toán thành công đơn hàng {order_code} - BIMAutomation"
    formatted_amount = f"{amount:,.0f}đ"
    text_body = (
        f"Chúc mừng bạn đã thanh toán thành công đơn hàng {order_code}!\n\n"
        f"Gói dịch vụ: {plan_name}\n"
        f"Số tiền: {formatted_amount}\n"
        f"Tài khoản kích hoạt: {email}\n\n"
        "Hướng dẫn kích hoạt trong Revit (Tự động 100%, không cần nhập mã Key):\n"
        "1. Tải bộ cài đặt duy nhất BIMAutomation.Installer.exe tại: https://bimautomation.myminiserver.info/download\n"
        "2. Mở Autodesk Revit (2022 - 2027), chọn Tab BIMAutomation trên thanh Ribbon.\n"
        f"3. Bấm Đăng nhập Google và chọn email {email}. Hệ thống tự động nhận diện bản quyền và kích hoạt ngay lập tức!"
    )
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1120; color: #e2e8f0; margin: 0; padding: 40px 20px;">
      <div style="max-width: 580px; margin: 0 auto; background: #1e293b; border-radius: 14px; border: 1px solid #334155; padding: 36px 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.4);">
        <div style="text-align: center; margin-bottom: 26px;">
          <img src="cid:brand_logo" alt="BIMAutomation Logo" width="64" height="64" style="display: block; margin: 0 auto 12px auto; border-radius: 14px; box-shadow: 0 4px 14px rgba(56, 189, 248, 0.35); border: 1px solid rgba(56, 189, 248, 0.4);" />
          <h1 style="color: #38bdf8; font-size: 24px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">BIMAutomation</h1>
          <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Hóa Đơn &amp; Xác Nhận Bản Quyền</p>
        </div>
        <div style="border-top: 1px solid #334155; padding-top: 22px; margin-bottom: 24px;">
          <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 8px; padding: 14px; text-align: center; margin-bottom: 22px;">
            <p style="color: #34d399; font-weight: bold; margin: 0; font-size: 15px;">✓ Thanh toán &amp; Kích hoạt thành công</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px; font-size: 14px;">
            <tr>
              <td style="color: #94a3b8; padding: 7px 0;">Mã đơn hàng:</td>
              <td style="color: #f8fafc; font-weight: bold; text-align: right;">{order_code}</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 7px 0;">Gói bản quyền:</td>
              <td style="color: #f8fafc; font-weight: bold; text-align: right;">{plan_name}</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 7px 0;">Số tiền thanh toán:</td>
              <td style="color: #38bdf8; font-weight: bold; text-align: right; font-size: 16px;">{formatted_amount}</td>
            </tr>
          </table>

          <div style="background: #090d16; border: 1px solid #334155; border-radius: 10px; padding: 18px; margin: 24px 0; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px;">Tài khoản bản quyền kích hoạt:</p>
            <div style="color: #38bdf8; font-size: 17px; font-weight: bold;">{email}</div>
            <p style="color: #34d399; font-size: 12px; margin: 6px 0 0 0; font-weight: 500;">✓ Tự động liên kết qua tài khoản Google — Không cần nhập License Key thủ công</p>
          </div>

          <h3 style="color: #f8fafc; font-size: 15px; margin: 22px 0 12px 0;">3 Bước kích hoạt nhanh trong Revit:</h3>
          <ol style="color: #cbd5e1; font-size: 13px; line-height: 1.7; padding-left: 20px; margin: 0 0 24px 0;">
            <li>Tải bộ cài đặt duy nhất <strong>BIMAutomation.Installer.exe</strong> tại <a href="https://bimautomation.myminiserver.info/download" style="color: #38bdf8; text-decoration: underline;">bimautomation.myminiserver.info/download</a>.</li>
            <li>Tắt Revit và chạy file cài đặt (tự động nhận diện Revit 2022 – 2027).</li>
            <li>Mở Revit, chọn Tab <strong>BIMAutomation</strong> và bấm <strong>Đăng nhập Google</strong> (chọn tài khoản <strong>{email}</strong>). Server sẽ tự động xác thực và mở khóa toàn bộ tính năng ngay lập tức!</li>
          </ol>
        </div>
        <div style="border-top: 1px solid #334155; padding-top: 18px; text-align: center;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">
            Cần hỗ trợ UltraViewer cài đặt từ xa? Gọi ngay: <strong style="color: #e2e8f0;">0799 660 737</strong> hoặc email <a href="mailto:support@bimautomation.solutions" style="color: #38bdf8; text-decoration: none; font-weight: bold;">support@bimautomation.solutions</a>
          </p>
        </div>
      </div>
    </body>
    </html>
    """
    return await send_email(to_email=email, subject=subject, html_content=html_body, text_content=text_body, settings=s)
