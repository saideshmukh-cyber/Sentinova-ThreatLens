from fastapi import FastAPI
from sqlalchemy import text

from backend.app.db.database import engine
from backend.app.api.indicators import router as indicators_router


app = FastAPI(
    title="ThreatLens API",
    description="Threat intelligence platform API",
    version="0.1.0",
)

app.include_router(indicators_router)


@app.get("/")
def root():
    return {
        "message": "ThreatLens API is running"
    }


@app.get("/health/database")
def database_health():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        return {
            "database": "connected",
            "result": result.scalar(),
        }