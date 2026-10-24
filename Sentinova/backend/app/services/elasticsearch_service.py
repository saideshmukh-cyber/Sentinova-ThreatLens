from datetime import datetime

from backend.app.elasticsearch import elasticsearch_client

INDEX_NAME = "threatlens_indicators"

INDICATOR_MAPPING = {
    "properties": {
        "id": {"type": "integer"},
        "indicator_type": {"type": "keyword"},
        "value": {"type": "keyword"},
        "value_search": {"type": "text"},
        "severity_score": {"type": "integer"},
        "confidence": {"type": "integer"},
        "tlp": {"type": "keyword"},
        "status": {"type": "keyword"},
        "tags": {"type": "keyword"},
        "attack_techniques": {"type": "keyword"},
        "notes": {"type": "text"},
        "created_at": {"type": "date"},
        "first_seen": {"type": "date"},
        "last_seen": {"type": "date"},
        "updated_at": {"type": "date"},
        "ttl_days": {"type": "integer"},
    }
}


def create_indicator_index() -> bool:
    if elasticsearch_client.indices.exists(index=INDEX_NAME):
        return False
    elasticsearch_client.indices.create(index=INDEX_NAME, mappings=INDICATOR_MAPPING)
    return True


def index_indicator(indicator) -> dict:
    document = {
        "id": indicator.id,
        "indicator_type": indicator.indicator_type.value if hasattr(indicator.indicator_type, "value") else str(indicator.indicator_type),
        "value": indicator.value,
        "value_search": indicator.value,
        "severity_score": int(indicator.severity_score or 0),
        "confidence": int(getattr(indicator, "confidence", 0) or 0),
        "tlp": getattr(indicator, "tlp", "clear"),
        "status": getattr(indicator, "status", "active"),
        "tags": list(getattr(indicator, "tags", []) or []),
        "attack_techniques": list(getattr(indicator, "attack_techniques", []) or []),
        "notes": getattr(indicator, "notes", None),
        "created_at": indicator.created_at.isoformat() if isinstance(indicator.created_at, datetime) else indicator.created_at,
        "first_seen": indicator.first_seen.isoformat() if isinstance(getattr(indicator, "first_seen", None), datetime) else getattr(indicator, "first_seen", None),
        "last_seen": indicator.last_seen.isoformat() if isinstance(getattr(indicator, "last_seen", None), datetime) else getattr(indicator, "last_seen", None),
        "updated_at": indicator.updated_at.isoformat() if isinstance(getattr(indicator, "updated_at", None), datetime) else getattr(indicator, "updated_at", None),
        "ttl_days": getattr(indicator, "ttl_days", None),
    }
    response = elasticsearch_client.index(index=INDEX_NAME, id=str(indicator.id), document=document)
    return {"result": response["result"], "document": document}


def delete_indicator(indicator_id: int) -> dict:
    try:
        response = elasticsearch_client.delete(index=INDEX_NAME, id=str(indicator_id))
        return {"result": response["result"], "id": indicator_id}
    except Exception:
        return {"result": "not_found", "id": indicator_id}


def search_indicators(query: str) -> list[dict]:
    response = elasticsearch_client.search(
        index=INDEX_NAME,
        size=100,
        query={
            "bool": {
                "should": [
                    {"term": {"value": query}},
                    {"match": {"value_search": query}},
                    {"match": {"notes": query}},
                ],
                "minimum_should_match": 1,
            }
        },
    )
    return [hit["_source"] for hit in response["hits"]["hits"]]


def search_by_indicator_type(indicator_type: str) -> list[dict]:
    response = elasticsearch_client.search(index=INDEX_NAME, query={"term": {"indicator_type": indicator_type.strip().lower()}})
    return [hit["_source"] for hit in response["hits"]["hits"]]
