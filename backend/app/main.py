from fastapi import FastAPI
from sqlalchemy import text

from backend.app.db.database import engine


app = FastAPI(
    title="ThreatLens API",
    description="Threat intelligence platform API",
    version="0.1.0",
)

from backend.app.db.database import Base, engine


Base.metadata.create_all(bind=engine)


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