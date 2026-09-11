from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse, FileResponse

from app.core.config import BASE_DIR, settings, logger
from app.core.telemetry import get_langfuse_client, flush_telemetry
from app.api.v1.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} on {settings.HOST}:{settings.PORT}")
    logger.info(f"Google API configured: {bool(settings.GOOGLE_API_KEY)}")
    logger.info(f"Storage directory: {settings.STORAGE_DIR}")
    if settings.is_langfuse_enabled:
        client = get_langfuse_client()
        logger.info(f"Langfuse tracing enabled: {client is not None} (host={settings.LANGFUSE_BASE_URL})")
    else:
        logger.info("Langfuse tracing disabled (missing keys or explicitly disabled)")
    yield
    logger.info(f"Shutting down {settings.APP_NAME}")
    flush_telemetry()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Microservice độc lập phục vụ diễn họa kiến trúc bằng AI (Revit 3D View to Photorealistic Render) tích hợp LangChain & Google Gemini.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Files for Outputs
app.mount("/static/outputs", StaticFiles(directory=settings.OUTPUTS_DIR), name="outputs")

# Mount Sample Data
if Path(settings.SAMPLE_DATA_DIR).exists():
    app.mount("/sample_data", StaticFiles(directory=settings.SAMPLE_DATA_DIR), name="sample_data")

# Mount Production Frontend if built
dist_dir = BASE_DIR.parent.parent / "frontend_ai_rendering" / "dist"
if dist_dir.exists():
    app.mount("/studio", StaticFiles(directory=str(dist_dir), html=True), name="studio")
    app.mount("/assets", StaticFiles(directory=str(dist_dir / "assets")), name="studio_assets")

    @app.get("/favicon.svg", include_in_schema=False)
    async def studio_favicon():
        return FileResponse(dist_dir / "favicon.svg")

# Include API Router
app.include_router(api_router, prefix="/api/v1")

@app.get("/", include_in_schema=False)
async def root():
    """Redirect root to /studio if built, otherwise docs."""
    dist_dir = BASE_DIR.parent.parent / "frontend_ai_rendering" / "dist"
    if dist_dir.exists():
        return RedirectResponse(url="/studio/")
    return RedirectResponse(url="/docs")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
