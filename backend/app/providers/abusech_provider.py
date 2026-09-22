import httpx
from backend.app.providers.base_feed_provider import BaseFeedProvider


class AbuseCHProvider(BaseFeedProvider):
    def __init__(self, name: str, url: str, indicator_type: str | None = None):
        self.name = name
        self.url = url
        self.indicator_type = indicator_type

    def fetch_indicators(self) -> list[dict]:
        with httpx.Client(timeout=45.0, follow_redirects=True) as client:
            response = client.get(self.url)
            response.raise_for_status()
        payload = response.json()
        rows = payload if isinstance(payload, list) else payload.get("data", [])
        result = []
        for row in rows:
            if not isinstance(row, dict):
                continue
            value = row.get("ip_address") or row.get("ip") or row.get("ioc") or row.get("url") or row.get("domain")
            if not value:
                continue
            indicator_type = self.indicator_type
            if indicator_type is None:
                if str(value).startswith(("http://", "https://")):
                    indicator_type = "url"
                elif "." in str(value):
                    indicator_type = "domain"
                else:
                    indicator_type = "ip"
            result.append({"indicator_type": indicator_type, "value": str(value), "source": self.name})
        return result
