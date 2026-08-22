from typing import Annotated

from fastapi import Depends, HTTPException, status

from app.core.config import Settings, settings
from app.core.security import current_active_user, fastapi_users
from app.models.user import User, UserRole

current_optional_user = fastapi_users.current_user(optional=True)


def get_settings() -> Settings:
    return settings


def get_current_admin_user(user: User = Depends(current_active_user)) -> User:
    if user.role != UserRole.ADMIN and not user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Admin privileges required",
        )
    return user


from app.core.dependencies import get_current_admin_user, get_current_user_flexible

SettingsDep = Annotated[Settings, Depends(get_settings)]
CurrentUserDep = Annotated[User, Depends(get_current_user_flexible)]
OptionalCurrentUserDep = Annotated[User | None, Depends(current_optional_user)]
CurrentAdminUserDep = Annotated[User, Depends(get_current_admin_user)]

