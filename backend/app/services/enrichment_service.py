import json
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.db.redis import redis_client
from backend.app.models.enrichment import IndicatorEnrichment
from backend.app.models.indicator import Indicator
from backend.app.providers.dns_provider import lookup_domain
from backend.app.providers.hash_provider import analyze_hash
from backend.app.providers.ip_provider import analyze_ip
from backend.app.providers.virustotal_provider import VirusTotalProvider
from backend.app.services.scoring_service import score_virustotal_result


ENRICHMENT_FRESHNESS_MINUTES = 5
DNS_CACHE_SECONDS = 300
IP_CACHE_SECONDS = 300
HASH_CACHE_SECONDS = 300
VT_CACHE_SECONDS = 600


def _cache_get(key: str):
    try:
        value = redis_client.get(key)
        return json.loads(value) if value else None
    except Exception:
        return None


def _cache_set(key: str, value: dict, ttl: int) -> None:
    try:
        redis_client.set(key, json.dumps(value), ex=ttl)
    except Exception:
        pass


def create_enrichment(db: Session, indicator_id: int, source: str, data: dict):
    enrichment = IndicatorEnrichment(
        indicator_id=indicator_id,
        source=source,
        data=data,
    )
    db.add(enrichment)
    db.commit()
    db.refresh(enrichment)
    return enrichment


def get_enrichments_for_indicator(db: Session, indicator_id: int):
    return (
        db.query(IndicatorEnrichment)
        .filter(IndicatorEnrichment.indicator_id == indicator_id)
        .order_by(IndicatorEnrichment.created_at.desc())
        .all()
    )


def get_recent_enrichment(db: Session, indicator_id: int, source: str):
    freshness_limit = datetime.utcnow() - timedelta(minutes=ENRICHMENT_FRESHNESS_MINUTES)
    return (
        db.query(IndicatorEnrichment)
        .filter(
            IndicatorEnrichment.indicator_id == indicator_id,
            IndicatorEnrichment.source == source,
            IndicatorEnrichment.created_at >= freshness_limit,
        )
        .order_by(IndicatorEnrichment.created_at.desc())
        .first()
    )


def enrich_domain(db: Session, indicator_id: int, domain: str):
    recent = get_recent_enrichment(db, indicator_id, "dns")
    if recent:
        return recent

    normalized_domain = domain.strip().lower().rstrip(".")
    cache_key = f"dns:{normalized_domain}"
    dns_data = _cache_get(cache_key)

    if dns_data is None:
        dns_data = lookup_domain(normalized_domain)
        _cache_set(cache_key, dns_data, DNS_CACHE_SECONDS)

    return create_enrichment(db, indicator_id, "dns", dns_data)


def enrich_ip(db: Session, indicator_id: int, ip: str):
    recent = get_recent_enrichment(db, indicator_id, "ip_analysis")
    if recent:
        return recent

    normalized_ip = ip.strip()
    cache_key = f"ip:{normalized_ip}"
    ip_data = _cache_get(cache_key)

    if ip_data is None:
        ip_data = analyze_ip(normalized_ip)
        _cache_set(cache_key, ip_data, IP_CACHE_SECONDS)

    # If VirusTotal is configured, include its reputation/detection data in the
    # IP result so the dedicated IP endpoint actually provides reputation data.
    if settings.virustotal_api_key:
        vt = enrich_virustotal_data(normalized_ip, "ip")
        if vt.get("status") == "ok":
            ip_data = dict(ip_data)
            ip_data["virustotal"] = vt
            ip_data["severity_score"] = vt.get("severity_score", 0)

    return create_enrichment(db, indicator_id, "ip_analysis", ip_data)


def enrich_hash(db: Session, indicator_id: int, value: str):
    recent = get_recent_enrichment(db, indicator_id, "hash_analysis")
    if recent:
        return recent

    normalized_hash = value.strip().lower()
    cache_key = f"hash:{normalized_hash}"
    hash_data = _cache_get(cache_key)

    if hash_data is None:
        hash_data = analyze_hash(normalized_hash)
        _cache_set(cache_key, hash_data, HASH_CACHE_SECONDS)

    if settings.virustotal_api_key:
        vt = enrich_virustotal_data(normalized_hash, "hash")
        if vt.get("status") == "ok":
            hash_data = dict(hash_data)
            hash_data["virustotal"] = vt
            hash_data["severity_score"] = vt.get("severity_score", 0)

    return create_enrichment(db, indicator_id, "hash_analysis", hash_data)


def enrich_virustotal_data(value: str, indicator_type: str) -> dict:
    normalized_type = indicator_type.strip().lower()
    normalized_value = value.strip().lower()
    cache_key = f"vt:{normalized_type}:{normalized_value}"

    cached = _cache_get(cache_key)
    if cached is not None:
        return cached

    provider = VirusTotalProvider(settings.virustotal_api_key)
    result = provider.enrich(value=normalized_value, indicator_type=normalized_type)

    if result.get("status") == "ok":
        result.update(score_virustotal_result(result))
        _cache_set(cache_key, result, VT_CACHE_SECONDS)

    return result


def enrich_virustotal(db: Session, indicator_id: int, indicator_type: str, value: str):
    recent = get_recent_enrichment(db, indicator_id, "virustotal")
    if recent:
        return recent

    result = enrich_virustotal_data(value, indicator_type)
    return create_enrichment(db, indicator_id, "virustotal", result)


def enrich_indicator(db: Session, indicator: Indicator):
    indicator_type = indicator.indicator_type.value
    enrichments = []

    if indicator_type == "domain":
        enrichments.append(enrich_domain(db, indicator.id, indicator.value))
    elif indicator_type == "ip":
        enrichments.append(enrich_ip(db, indicator.id, indicator.value))
    elif indicator_type == "hash":
        enrichments.append(enrich_hash(db, indicator.id, indicator.value))

    if indicator_type in {"ip", "domain", "url", "hash"}:
        enrichments.append(
            enrich_virustotal(
                db=db,
                indicator_id=indicator.id,
                indicator_type=indicator_type,
                value=indicator.value,
            )
        )

    return enrichments
