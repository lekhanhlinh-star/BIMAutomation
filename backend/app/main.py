from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.endpoints import oauth_desktop
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import setup_logging
from app.db.base import Base
from app.db.migrations import apply_sqlite_migrations
from app.db.session import engine
from app.db.seed import seed_initial_data

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    if settings.database_url.startswith("sqlite"):
        import pathlib
        db_raw = settings.database_url.replace("sqlite+aiosqlite:///", "").replace("sqlite:///", "")
        db_file = pathlib.Path(db_raw)
        if db_file.parent and not db_file.parent.exists():
            db_file.parent.mkdir(parents=True, exist_ok=True)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        if settings.database_url.startswith("sqlite"):
            await apply_sqlite_migrations(conn)

    await seed_initial_data()
    yield


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
register_exception_handlers(app)

# Include OAuth router at root level (/oauth/authorize, /oauth/token, /oauth/revoke)
app.include_router(oauth_desktop.router)

# Include API Router (/api/v1/...)
app.include_router(api_router, prefix="/api")


@app.get("/", tags=["root"])
def root() -> dict[str, str]:
    return {"message": f"Welcome to {settings.app_name}"}
