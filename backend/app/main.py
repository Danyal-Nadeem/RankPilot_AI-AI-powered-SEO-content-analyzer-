import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import db_manager
from app.routers import health, auth, scrape, score, analyze, competitor, keyword, dashboard, bulk

# Setup logging config
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


from app.core.indexes import create_indexes


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to databases
    logger.info("Starting up FastAPI application...")
    await db_manager.connect()
    # Create MongoDB indexes
    if db_manager.db is not None:
        await create_indexes(db_manager.db)
    yield
    # Shutdown: Close database connections
    logger.info("Shutting down FastAPI application...")
    await db_manager.close()


app = FastAPI(
    title="RankPilot AI",
    description="""
## 🚀 RankPilot AI — SEO Content Analysis API

AI-powered SEO content analysis and competitor tracking platform.

### Key Capabilities
- **URL Scraper**: Extract page metadata, headings, body text, images & links
- **SEO Scoring**: 7-category weighted audit with actionable suggestions
- **AI Suggestions**: Claude-generated content improvements and full rewrites
- **Competitor Analysis**: Side-by-side SEO comparison of two domains
- **Keyword Research**: LSI keywords, intent classification, search volumes
- **Bulk Scanning**: Queue up to 20 URLs via background Celery jobs
- **PDF Export**: Branded SEO report PDF download

### Authentication
All protected endpoints require a **Bearer JWT token** in the `Authorization` header:
```
Authorization: Bearer <access_token>
```
Obtain a token via `POST /api/v1/auth/login`.
""",
    version="1.0.0",
    contact={
        "name": "RankPilot AI Support",
        "url": "https://github.com/your-username/RankPilot_AI",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
    openapi_tags=[
        {"name": "health", "description": "Server health check"},
        {"name": "auth", "description": "Registration, login, JWT tokens, email verification"},
        {"name": "scrape", "description": "URL scraping — extract page content"},
        {"name": "score", "description": "SEO audit and scoring"},
        {"name": "ai", "description": "AI-powered content suggestions and rewrites"},
        {"name": "competitor", "description": "Competitor domain comparison"},
        {"name": "keyword", "description": "Keyword research and LSI analysis"},
        {"name": "dashboard", "description": "Report history, stats, and management"},
        {"name": "bulk", "description": "Bulk URL scanning with Celery background jobs"},
    ],
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
app.include_router(auth.router, prefix="/api/v1")
app.include_router(scrape.router, prefix="/api/v1")
app.include_router(score.router, prefix="/api/v1")
app.include_router(analyze.router, prefix="/api/v1")
app.include_router(competitor.router, prefix="/api/v1")
app.include_router(keyword.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(bulk.router, prefix="/api/v1")


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
