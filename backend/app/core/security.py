import uuid

from fastapi_users import FastAPIUsers
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy,
)
from typing import Any, cast
from httpx_oauth.clients.google import GoogleOAuth2
from httpx_oauth.exceptions import GetProfileError, GetIdEmailError

from app.core.config import settings
from app.models.user import User
from app.services.user_manager import get_user_manager


class CustomGoogleOAuth2(GoogleOAuth2):
    """
    Custom Google OAuth2 client using standard OpenID Connect userinfo endpoint.
    This avoids HTTP 403 Forbidden errors when Google People API is disabled on GCP.
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

        user_id = profile.get("sub", "")
        user_email = profile.get("email")
        return user_id, user_email


bearer_transport = BearerTransport(tokenUrl="api/v1/auth/jwt/login")


def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=settings.secret_key, lifetime_seconds=3600)


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
