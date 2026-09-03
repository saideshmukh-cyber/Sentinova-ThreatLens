from fastapi import FastAPI
from sqlalchemy import text

from backend.app.api.enrichments import (
    router as enrichments_router,
)
from backend.app.api.feeds import (
    router as feeds_router,
)
from backend.app.api.indicators import (
    router as indicators_router,
)
from backend.app.api.investigations import (
    router as investigations_router,
)
from backend.app.db.database import engine


app = FastAPI(
    title="ThreatLens API",
    description="Threat intelligence platform API",
    version="0.1.0",
)


app.include_router(
    indicators_router
)

app.include_router(
    enrichments_router
)

app.include_router(
    investigations_router
)

app.include_router(
    feeds_router
)


@app.get("/")
def root():
    return {
        "message": "ThreatLens API is running"
    }


@app.get("/health/database")
def database_health():
    with engine.connect() as connection:
        result = connection.execute(
            text("SELECT 1")
        )

        return {
            "database": "connected",
            "result": result.scalar(),
        }