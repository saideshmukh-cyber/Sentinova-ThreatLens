from sqlalchemy.orm import Session
import json
from backend.app.models.enrichment import IndicatorEnrichment
from backend.app.providers.dns_provider import lookup_domain
from backend.app.providers.ip_provider import analyze_ip
from backend.app.db.redis import redis_client
from backend.app.providers.hash_provider import analyze_hash
from backend.app.config import settings
from backend.app.providers.virustotal_provider import VirusTotalProvider

def create_enrichment(
    db: Session,
    indicator_id: int,
    source: str,
    data: dict,
):
    enrichment = IndicatorEnrichment(
        indicator_id=indicator_id,
        source=source,
        data=data,
    )

    db.add(enrichment)
    db.commit()
    db.refresh(enrichment)

    return enrichment


def get_enrichments_for_indicator(
    db: Session,
    indicator_id: int,
):
    return db.query(IndicatorEnrichment).filter(
        IndicatorEnrichment.indicator_id == indicator_id
    ).all()

def enrich_domain(
    db: Session,
    indicator_id: int,
    domain: str,
):
    cache_key = f"dns:{domain}"

    cached_data = redis_client.get(cache_key)

    if cached_data:
    
        dns_data = json.loads(cached_data)

    else:
        dns_data = lookup_domain(domain)

        redis_client.set(
            cache_key,
            json.dumps(dns_data),
            ex=300,
        )

    return create_enrichment(
        db=db,
        indicator_id=indicator_id,
        source="dns",
        data=dns_data,
    )

def enrich_ip(
    db: Session,
    indicator_id: int,
    ip: str,
):
    ip_data = analyze_ip(ip)

    return create_enrichment(
        db=db,
        indicator_id=indicator_id,
        source="ip_analysis",
        data=ip_data,
    )

def enrich_hash(
    db: Session,
    indicator_id: int,
    value: str,
):
    hash_data = analyze_hash(value)

    return create_enrichment(
        db=db,
        indicator_id=indicator_id,
        source="hash_analysis",
        data=hash_data,
    )

def enrich_virustotal(
    db: Session,
    indicator_id: int,
    indicator_type: str,
    value: str,
):
    normalized_type = indicator_type.strip().upper()
    normalized_value = value.strip().lower()

    cache_key = f"vt:{normalized_type}:{normalized_value}"

    cached_data = redis_client.get(cache_key)

    if cached_data:
        result = json.loads(cached_data)

    else:
        provider = VirusTotalProvider(
            settings.virustotal_api_key
        )

        result = provider.enrich(
            value=normalized_value,
            indicator_type=normalized_type,
        )

        if result.get("status") == "ok":
            redis_client.set(
                cache_key,
                json.dumps(result),
                ex=600,
            )

    return create_enrichment(
        db=db,
        indicator_id=indicator_id,
        source="virustotal",
        data=result,
    )