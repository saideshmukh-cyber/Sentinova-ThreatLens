from datetime import datetime

from backend.app.elasticsearch import (
    elasticsearch_client,
)


INDEX_NAME = "threatlens_indicators"


INDICATOR_MAPPING = {
    "properties": {
        "id": {
            "type": "integer",
        },
        "indicator_type": {
            "type": "keyword",
        },
        "value": {
            "type": "keyword",
        },
        "created_at": {
            "type": "date",
        },
    }
}


def create_indicator_index() -> bool:
    if elasticsearch_client.indices.exists(
        index=INDEX_NAME
    ):
        return False

    elasticsearch_client.indices.create(
        index=INDEX_NAME,
        mappings=INDICATOR_MAPPING,
    )

    return True


def index_indicator(
    indicator,
) -> dict:
    document = {
        "id": indicator.id,
        "indicator_type": (
            indicator.indicator_type.value
            if hasattr(
                indicator.indicator_type,
                "value",
            )
            else str(
                indicator.indicator_type
            )
        ),
        "value": indicator.value,
        "created_at": (
            indicator.created_at.isoformat()
            if isinstance(
                indicator.created_at,
                datetime,
            )
            else indicator.created_at
        ),
    }

    response = elasticsearch_client.index(
        index=INDEX_NAME,
        id=str(indicator.id),
        document=document,
    )

    return {
        "result": response["result"],
        "document": document,
    }


def delete_indicator(
    indicator_id: int,
) -> dict:
    try:
        response = (
            elasticsearch_client.delete(
                index=INDEX_NAME,
                id=str(indicator_id),
            )
        )

        return {
            "result": response["result"],
            "id": indicator_id,
        }

    except Exception:
        return {
            "result": "not_found",
            "id": indicator_id,
        }


def search_indicators(
    query: str,
) -> list[dict]:
    response = elasticsearch_client.search(
        index=INDEX_NAME,
        query={
            "match": {
                "value": query,
            }
        },
    )

    results = []

    for hit in response["hits"]["hits"]:
        results.append(
            hit["_source"]
        )

    return results


def search_by_indicator_type(
    indicator_type: str,
) -> list[dict]:
    indicator_type = (
        indicator_type.strip().lower()
    )

    response = elasticsearch_client.search(
        index=INDEX_NAME,
        query={
            "term": {
                "indicator_type": indicator_type,
            }
        },
    )

    results = []

    for hit in response["hits"]["hits"]:
        results.append(
            hit["_source"]
        )

    return results