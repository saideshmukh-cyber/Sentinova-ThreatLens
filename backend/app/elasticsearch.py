from elasticsearch import Elasticsearch

from backend.app.config import settings


elasticsearch_client = Elasticsearch(
    settings.elasticsearch_url,
)


def check_elasticsearch_connection() -> bool:
    return elasticsearch_client.ping()