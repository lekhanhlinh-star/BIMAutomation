import uuid
import logging
from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends, Request
from fastapi_users import BaseUserManager, UUIDIDMixin
from fastapi_users.exceptions import InvalidPasswordException
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_async_session
from app.models.oauth import OAuthAccount
from app.models.user import User
from app.services import email_service

logger = logging.getLogger(__name__)


class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = settings.secret_key
    verification_token_secret = settings.secret_key

    async def validate_password(self, password: str, user: User | None = None) -> None:
        if len(password) < 8:
            raise InvalidPasswordException(reason="Mật khẩu phải có ít nhất 8 ký tự.")

    async def on_after_register(self, user: User, request: Request | None = None) -> None:
        print(f"User {user.id} has registered.")

    async def on_after_forgot_password(
        self, user: User, token: str, request: Request | None = None
    ) -> None:
        reset_url = f"{settings.frontend_reset_url}?token={token}"
        try:
            await email_service.send_password_reset_email(user.email, reset_url, settings)
        except Exception:
            logger.exception("Failed to send password reset email")

    async def on_after_request_verify(
        self, user: User, token: str, request: Request | None = None
    ) -> None:
        print(f"Verification requested for user {user.id}. Verification token: {token}")


async def get_user_db(
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> AsyncGenerator[SQLAlchemyUserDatabase, None]:
    yield SQLAlchemyUserDatabase(session, User, OAuthAccount)


async def get_user_manager(
    user_db: Annotated[SQLAlchemyUserDatabase, Depends(get_user_db)],
) -> AsyncGenerator[UserManager, None]:
    yield UserManager(user_db)
