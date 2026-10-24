from collections import Counter

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.models.indicator import Indicator
from backend.app.models.security_event import SecurityEvent
from backend.app.services.elasticsearch_service import search_indicators

router = APIRouter(prefix="/api/v1/search", tags=["Search"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("")
def global_search(
    q: str = Query(min_length=1, max_length=300),
    limit: int = Query(50, ge=1, le=200),
    indicator_type: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    q = q.strip()
    indicator_results = search_indicators(q)
    if indicator_type:
        indicator_results = [item for item in indicator_results if item.get("indicator_type") == indicator_type.strip().lower()]
    if not indicator_results:
        query = db.query(Indicator).filter(Indicator.value.ilike(f"%{q}%"))
        if indicator_type:
            query = query.filter(Indicator.indicator_type == indicator_type.strip().lower())
        indicator_rows = query.order_by(Indicator.severity_score.desc()).limit(limit).all()
        indicator_results = [
            {"id": item.id, "indicator_type": item.indicator_type.value, "value": item.value, "severity_score": item.severity_score}
            for item in indicator_rows
        ]

    events = (
        db.query(SecurityEvent)
        .filter(
            or_(
                SecurityEvent.indicator_value.ilike(f"%{q}%"),
                SecurityEvent.source.ilike(f"%{q}%"),
                SecurityEvent.event_type.ilike(f"%{q}%"),
                SecurityEvent.category.ilike(f"%{q}%"),
            )
        )
        .order_by(SecurityEvent.timestamp.desc())
        .limit(limit)
        .all()
    )
    return {
        "query": q,
        "indicators": indicator_results[:limit],
        "events": [
            {"id": event.id, "indicator_value": event.indicator_value, "source": event.source, "event_type": event.event_type, "category": event.category, "timestamp": event.timestamp.isoformat()}
            for event in events
        ],
        "facets": {
            "indicator_types": Counter(item.get("indicator_type") for item in indicator_results),
            "event_categories": Counter(event.category or "uncategorized" for event in events),
            "event_sources": Counter(event.source or "unknown" for event in events),
        },
    }
