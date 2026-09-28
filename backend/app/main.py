import asyncio

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from backend.app.api import alert_rules, dashboard, incidents
from backend.app.api.alerts import router as alerts_router
from backend.app.api.auth import router as auth_router
from backend.app.api.enrichments import router as enrichments_router
from backend.app.api.exports import router as exports_router
from backend.app.api.feeds import router as feeds_router
from backend.app.api.indicator_sources import router as indicator_sources_router
from backend.app.api.indicators import router as indicators_router
from backend.app.api.investigations import router as investigations_router
from backend.app.api.relationships import router as relationships_router
from backend.app.api.reports import router as reports_router
from backend.app.api.search import router as search_router
from backend.app.api.security_events import router as security_events_router
from backend.app.api.saved_hunts import router as saved_hunts_router
from backend.app.api.websocket import router as websocket_router
from backend.app.auth_middleware import AuthMiddleware
from backend.app.audit_middleware import AuditMiddleware
from backend.app.config import settings
from backend.app.db.database import SessionLocal, engine
from backend.app.elasticsearch import check_elasticsearch_connection
from backend.app.models.indicator import Indicator
from backend.app.services.auth_service import bootstrap_admin
from backend.app.services.elasticsearch_service import (
    create_indicator_index,
    index_indicator,
    search_by_indicator_type,
    search_indicators,
)
from backend.app.services.maintenance_service import expire_stale_indicators
from backend.app.services.scheduler_service import run_due_feeds


async def _maintenance_loop() -> None:
    while True:
        db = SessionLocal()
        try:
            expire_stale_indicators(db)
        except Exception:
            db.rollback()
        finally:
            db.close()
        if settings.feed_scheduler_enabled:
            await asyncio.to_thread(run_due_feeds)
        await asyncio.sleep(max(60, settings.maintenance_interval_minutes * 60, settings.feed_scheduler_interval_minutes * 60 if settings.feed_scheduler_enabled else 60))


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    task = None
    try:
        try:
            bootstrap_admin(db)
        except Exception:
            db.rollback()
        try:
            create_indicator_index()
        except Exception:
            pass
        try:
            from backend.app.api.feeds import _ensure_configs
            _ensure_configs(db)
        except Exception:
            db.rollback()
        try:
            expire_stale_indicators(db)
        except Exception:
            db.rollback()
        if settings.maintenance_enabled:
            task = asyncio.create_task(_maintenance_loop())
    finally:
        db.close()
    yield
    if task:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title="ThreatLens API",
    description="Cyber threat intelligence operations API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(AuthMiddleware)
app.add_middleware(AuditMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(indicators_router)
app.include_router(relationships_router)
app.include_router(enrichments_router)
app.include_router(investigations_router)
app.include_router(feeds_router)
app.include_router(alerts_router)
app.include_router(security_events_router)
app.include_router(alert_rules.router)
app.include_router(incidents.router)
app.include_router(websocket_router)
app.include_router(dashboard.router)
app.include_router(indicator_sources_router)
app.include_router(search_router)
app.include_router(exports_router)
app.include_router(reports_router)
app.include_router(saved_hunts_router)


@app.get("/")
def root():
    return {"message": "ThreatLens API is running", "version": "1.0.0"}


@app.get("/health/database")
def database_health():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        return {"database": "connected", "result": result.scalar()}


@app.get("/health/elasticsearch")
def elasticsearch_health():
    return {"elasticsearch": "connected" if check_elasticsearch_connection() else "disconnected"}


@app.post("/admin/elasticsearch/index")
def create_elasticsearch_index():
    return {"index": "threatlens_indicators", "created": create_indicator_index()}


@app.post("/admin/elasticsearch/index-indicator/{indicator_id}")
def index_existing_indicator(indicator_id: int):
    db = SessionLocal()
    try:
        indicator = db.query(Indicator).filter(Indicator.id == indicator_id).first()
        if indicator is None:
            return {"error": "Indicator not found"}
        return index_indicator(indicator)
    finally:
        db.close()


@app.get("/admin/elasticsearch/search")
def search_elasticsearch(query: str):
    return {"query": query, "results": search_indicators(query)}


@app.get("/admin/elasticsearch/search/type")
def search_elasticsearch_by_type(indicator_type: str):
    return {"indicator_type": indicator_type, "results": search_by_indicator_type(indicator_type)}
