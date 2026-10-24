from collections import Counter, defaultdict
from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.app.models.alert import Alert, AlertStatus
from backend.app.models.indicator import Indicator
from backend.app.models.indicator_source import IndicatorSource
from backend.app.models.incident import Incident
from backend.app.models.investigation import Investigation
from backend.app.models.security_event import SecurityEvent


def _day_key(value: datetime) -> str:
    return value.date().isoformat()


def _last_days(days: int):
    today = datetime.utcnow().date()
    return [(today - timedelta(days=days - 1 - index)).isoformat() for index in range(days)]


def _risk_score(scores: list[int]) -> int:
    if not scores:
        return 0
    scores = sorted(scores, reverse=True)
    return round(sum(scores[: min(50, len(scores))]) / min(50, len(scores)))


def _extract_geo(data):
    if not isinstance(data, dict):
        return None
    country = data.get("country") or data.get("country_name")
    country_code = data.get("country_code") or data.get("countryCode")
    latitude = data.get("latitude") or data.get("lat")
    longitude = data.get("longitude") or data.get("lon") or data.get("lng")
    if isinstance(data.get("geo"), dict):
        geo = data["geo"]
        country = country or geo.get("country") or geo.get("country_name")
        country_code = country_code or geo.get("country_code") or geo.get("countryCode")
        latitude = latitude or geo.get("latitude") or geo.get("lat")
        longitude = longitude or geo.get("longitude") or geo.get("lon")
    if country or country_code:
        return {"country": country, "country_code": country_code, "latitude": latitude, "longitude": longitude}
    return None


def get_dashboard_analytics(db: Session):
    now = datetime.utcnow()
    days = _last_days(30)

    indicators = db.query(Indicator).all()
    alerts = db.query(Alert).all()
    incidents = db.query(Incident).all()
    events = db.query(SecurityEvent).all()
    sources = db.query(IndicatorSource).all()

    scores = [int(item.severity_score or 0) for item in indicators]
    critical_high = sum(1 for score in scores if score >= 70)

    volume_counter = Counter(_day_key(item.created_at) for item in indicators)
    alert_open_counter = Counter(_day_key(item.created_at) for item in alerts if item.status in {AlertStatus.NEW, AlertStatus.ACKNOWLEDGED, AlertStatus.IN_PROGRESS})
    alert_resolved_counter = Counter(_day_key(item.updated_at or item.created_at) for item in alerts if item.status in {AlertStatus.RESOLVED, AlertStatus.CLOSED})
    event_counter = Counter(_day_key(item.created_at) for item in events)

    categories = Counter((item.category or "uncategorized").strip().lower() for item in events)
    source_counts = Counter(item.source for item in sources)
    attack_counts = Counter(technique for item in indicators for technique in (item.attack_techniques or []))

    severity_distribution = {
        "critical": sum(1 for score in scores if score >= 90),
        "high": sum(1 for score in scores if 70 <= score < 90),
        "medium": sum(1 for score in scores if 40 <= score < 70),
        "low": sum(1 for score in scores if score < 40),
    }

    top_indicators = sorted(indicators, key=lambda item: (item.severity_score or 0), reverse=True)[:12]
    geo_counter = Counter()
    geo_meta = {}
    try:
        from backend.app.models.enrichment import IndicatorEnrichment
        enrichments = db.query(IndicatorEnrichment).all()
        for enrichment in enrichments:
            geo = _extract_geo(enrichment.data)
            if geo and (geo.get("country_code") or geo.get("country")):
                key = geo.get("country_code") or geo.get("country")
                geo_counter[key] += 1
                geo_meta[key] = geo
    except Exception:
        pass

    geo_activity = [
        {"region": key, "count": count, **geo_meta.get(key, {})}
        for key, count in geo_counter.most_common(20)
    ]

    return {
        "generated_at": now.isoformat(),
        "risk_score": _risk_score(scores),
        "active_critical_high": critical_high,
        "open_alerts": sum(1 for item in alerts if item.status in {AlertStatus.NEW, AlertStatus.ACKNOWLEDGED, AlertStatus.IN_PROGRESS}),
        "resolved_alerts": sum(1 for item in alerts if item.status in {AlertStatus.RESOLVED, AlertStatus.CLOSED}),
        "open_incidents": sum(1 for item in incidents if item.status.value in {"open", "in-progress"}),
        "high_risk_investigations": sum(1 for item in db.query(Investigation).all() if item.risk_level in {"HIGH", "CRITICAL"}),
        "volume_trend": [{"date": day, "indicators": volume_counter[day], "events": event_counter[day]} for day in days],
        "alert_trend": [{"date": day, "open": alert_open_counter[day], "resolved": alert_resolved_counter[day]} for day in days],
        "category_breakdown": [{"label": key, "value": value} for key, value in categories.most_common(10)],
        "source_breakdown": [{"label": key, "value": value} for key, value in source_counts.most_common(10)],
        "attack_technique_breakdown": [{"label": key, "value": value} for key, value in attack_counts.most_common(12)],
        "severity_distribution": severity_distribution,
        "geo_activity": geo_activity,
        "top_indicators": [
            {
                "id": item.id,
                "value": item.value,
                "indicator_type": item.indicator_type.value,
                "severity_score": item.severity_score,
            }
            for item in top_indicators
        ],
    }
