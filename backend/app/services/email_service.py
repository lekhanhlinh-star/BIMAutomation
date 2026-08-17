import asyncio
import logging
import smtplib
from email.message import EmailMessage

from app.core.config import Settings

logger = logging.getLogger(__name__)


async def send_password_reset_email(email: str, reset_url: str, settings: Settings) -> bool:
    if not settings.smtp_host or not settings.smtp_sender:
        logger.warning("Password reset email skipped because SMTP is not configured")
        return False

    message = EmailMessage()
    message["Subject"] = "Đặt lại mật khẩu BIMAutomation"
    message["From"] = settings.smtp_sender
    message["To"] = email
    message.set_content(
        "Bạn đã yêu cầu đặt lại mật khẩu BIMAutomation. "
        f"Mở liên kết sau để tiếp tục: {reset_url}\n\n"
        "Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email."
    )
    message.add_alternative(
        f"""<p>Bạn đã yêu cầu đặt lại mật khẩu BIMAutomation.</p>
        <p><a href=\"{reset_url}\">Đặt lại mật khẩu</a></p>
        <p>Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.</p>""",
        subtype="html",
    )

    def _send() -> None:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
            if settings.smtp_use_tls:
                smtp.starttls()
            if settings.smtp_username:
                smtp.login(settings.smtp_username, settings.smtp_password)
            smtp.send_message(message)

    await asyncio.to_thread(_send)
    return True
