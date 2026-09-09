from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from backend.app.api.alerts import router as alerts_router
from backend.app.api.enrichments import router as enrichments_router
from backend.app.api.feeds import router as feeds_router
from backend.app.api.indicators import router as indicators_router
from backend.app.api.investigations import (
    router as investigations_router,
)
from backend.app.db.database import SessionLocal, engine
from backend.app.elasticsearch import check_elasticsearch_connection
from backend.app.models.indicator import Indicator
from backend.app.services.elasticsearch_service import (
    create_indicator_index,
    index_indicator,
    search_by_indicator_type,
    search_indicators,
)
from backend.app.api import security_events
from backend.app.api import alert_rules
from backend.app.api import incidents


app = FastAPI(
    title="ThreatLens API",
    description="Threat intelligence platform API",
    version="0.1.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(indicators_router)
app.include_router(enrichments_router)
app.include_router(investigations_router)
app.include_router(feeds_router)
app.include_router(alerts_router)
app.include_router(security_events.router)
app.include_router(alert_rules.router)
app.include_router(incidents.router)

@app.get("/")
def root():
    return {"message": "ThreatLens API is running"}


@app.get("/health/database")
def database_health():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
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


@app.post(
    "/admin/elasticsearch/index-indicator/{indicator_id}"
)
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
                "error": "Indicator not found"
            }

        return index_indicator(indicator)

    finally:
        db.close()


@app.get("/admin/elasticsearch/search")
def search_elasticsearch(
    query: str,
):
    return {
        "query": query,
        "results": search_indicators(query),
    }


@app.get("/admin/elasticsearch/search/type")
def search_elasticsearch_by_type(
    indicator_type: str,
):
    return {
        "indicator_type": indicator_type,
        "results": search_by_indicator_type(
            indicator_type
        ),
    }