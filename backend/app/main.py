from fastapi import FastAPI
from sqlalchemy import text
from backend.app.elasticsearch import (
    check_elasticsearch_connection,
)
from backend.app.services.elasticsearch_service import (
    create_indicator_index,
    index_indicator,
)

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
from backend.app.db.database import SessionLocal
from backend.app.models.indicator import Indicator
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

@app.get("/health/elasticsearch")
def elasticsearch_health():
    return {
        "elasticsearch": (
            "connected"
            if check_elasticsearch_connection()
            else "disconnected"
        )
    }

@app.post("/admin/elasticsearch/index")
def create_elasticsearch_index():
    created = create_indicator_index()

    return {
        "index": "threatlens_indicators",
        "created": created,
    }

@app.post("/admin/elasticsearch/index-indicator/{indicator_id}")
def index_existing_indicator(
    indicator_id: int,
):
    db = SessionLocal()

    try:
        indicator = (
            db.query(Indicator)
            .filter(
                Indicator.id == indicator_id
            )
            .first()
        )

        if indicator is None:
            return {
                "error": "Indicator not found",
            }

        return index_indicator(indicator)

    finally:
        db.close()