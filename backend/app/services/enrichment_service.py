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
from backend.app.providers.virustotal_provider import (
    VirusTotalProvider,
)
from backend.app.services.scoring_service import (
    score_virustotal_result,
)


ENRICHMENT_FRESHNESS_MINUTES = 5


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
    return (
        db.query(IndicatorEnrichment)
        .filter(
            IndicatorEnrichment.indicator_id
            == indicator_id
        )
        .all()
    )


def get_recent_enrichment(
    db: Session,
    indicator_id: int,
    source: str,
):
    freshness_limit = (
        datetime.utcnow()
        - timedelta(
            minutes=ENRICHMENT_FRESHNESS_MINUTES
        )
    )

    return (
        db.query(IndicatorEnrichment)
        .filter(
            IndicatorEnrichment.indicator_id
            == indicator_id,
            IndicatorEnrichment.source
            == source,
            IndicatorEnrichment.created_at
            >= freshness_limit,
        )
        .order_by(
            IndicatorEnrichment.created_at.desc()
        )
        .first()
    )


def enrich_domain(
    db: Session,
    indicator_id: int,
    domain: str,
):
    recent_enrichment = get_recent_enrichment(
        db,
        indicator_id,
        "dns",
    )

    if recent_enrichment:
        return recent_enrichment

    normalized_domain = (
        domain.strip().lower()
    )

    cache_key = (
        f"dns:{normalized_domain}"
    )

    cached_data = redis_client.get(
        cache_key
    )

    if cached_data:
        dns_data = json.loads(
            cached_data
        )

    else:
        dns_data = lookup_domain(
            normalized_domain
        )

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
    recent_enrichment = get_recent_enrichment(
        db,
        indicator_id,
        "ip_analysis",
    )

    if recent_enrichment:
        return recent_enrichment

    normalized_ip = ip.strip()

    ip_data = analyze_ip(
        normalized_ip
    )

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
    recent_enrichment = get_recent_enrichment(
        db,
        indicator_id,
        "hash_analysis",
    )

    if recent_enrichment:
        return recent_enrichment

    normalized_hash = (
        value.strip().lower()
    )

    hash_data = analyze_hash(
        normalized_hash
    )

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
    recent_enrichment = get_recent_enrichment(
        db,
        indicator_id,
        "virustotal",
    )

    if recent_enrichment:
        return recent_enrichment

    normalized_type = (
        indicator_type.strip().upper()
    )

    normalized_value = (
        value.strip().lower()
    )

    cache_key = (
        f"vt:{normalized_type}:"
        f"{normalized_value}"
    )

    cached_data = redis_client.get(
        cache_key
    )

    if cached_data:
        result = json.loads(
            cached_data
        )

    else:
        provider = VirusTotalProvider(
            settings.virustotal_api_key
        )

        result = provider.enrich(
            value=normalized_value,
            indicator_type=normalized_type,
        )

        if result.get("status") == "ok":
            score_data = (
                score_virustotal_result(
                    result
                )
            )

            result.update(
                score_data
            )

            redis_client.set(
                cache_key,
                json.dumps(result),
                ex=600,
            )

    if result.get("status") == "ok":
        score_data = (
            score_virustotal_result(
                result
            )
        )

        result.update(
            score_data
        )

    return create_enrichment(
        db=db,
        indicator_id=indicator_id,
        source="virustotal",
        data=result,
    )


def enrich_indicator(
    db: Session,
    indicator: Indicator,
):
    indicator_type = (
        indicator.indicator_type.value
    )

    enrichments = []

    if indicator_type == "domain":
        enrichments.append(
            enrich_domain(
                db=db,
                indicator_id=indicator.id,
                domain=indicator.value,
            )
        )

    elif indicator_type == "ip":
        enrichments.append(
            enrich_ip(
                db=db,
                indicator_id=indicator.id,
                ip=indicator.value,
            )
        )

    elif indicator_type == "hash":
        enrichments.append(
            enrich_hash(
                db=db,
                indicator_id=indicator.id,
                value=indicator.value,
            )
        )

    enrichments.append(
        enrich_virustotal(
            db=db,
            indicator_id=indicator.id,
            indicator_type=indicator_type,
            value=indicator.value,
        )
    )

    return enrichments