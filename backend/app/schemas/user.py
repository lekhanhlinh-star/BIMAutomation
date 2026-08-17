import uuid

from fastapi_users import schemas

from app.models.user import UserRole


class UserRead(schemas.BaseUser[uuid.UUID]):
    name: str | None = None
    phone: str | None = None
    role: UserRole = UserRole.USER
    oauth_accounts: list[schemas.BaseOAuthAccount] = []


class UserCreate(schemas.BaseUserCreate):
    name: str | None = None
    phone: str | None = None
    role: UserRole = UserRole.USER


class UserUpdate(schemas.BaseUserUpdate):
    name: str | None = None
    phone: str | None = None
    role: UserRole | None = None


