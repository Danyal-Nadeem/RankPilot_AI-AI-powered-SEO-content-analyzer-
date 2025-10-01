import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import db_manager
from app.routers import health

# Setup logging config
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to databases
    logger.info("Starting up FastAPI application...")
    await db_manager.connect()
    yield
    # Shutdown: Close database connections
    logger.info("Shutting down FastAPI application...")
    await db_manager.close()


app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered SEO content analysis and competitor tracking platform API.",
    version="1.0.0",
    debug=settings.DEBUG,
    lifespan=lifespan,
)

# CORS setup
origins = []
if isinstance(settings.CORS_ORIGINS, list):
    origins = [str(origin) for origin in settings.CORS_ORIGINS]
else:
    origins = [str(settings.CORS_ORIGINS)]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api/v1")


@app.get("/")
def read_root():
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "docs_url": "/docs",
        "status": "online"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
