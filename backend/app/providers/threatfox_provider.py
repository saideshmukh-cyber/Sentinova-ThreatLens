import httpx
from backend.app.providers.base_feed_provider import BaseFeedProvider


class ThreatFoxProvider(BaseFeedProvider):
    name = "threatfox"
    url = "https://threatfox.abuse.ch/export/json/recent/"

    def fetch_indicators(self) -> list[dict]:
        with httpx.Client(timeout=45.0) as client:
            response = client.get(self.url)
            response.raise_for_status()
        payload = response.json()
        result = []
        rows = payload if isinstance(payload, list) else payload.get("data", [])
        for row in rows:
            if not isinstance(row, dict):
                continue
            value = row.get("ioc")
            if not value:
                continue
            ioc_type = str(row.get("ioc_type", "")).lower()
            if "ip" in ioc_type:
                indicator_type = "ip"
            elif "domain" in ioc_type:
                indicator_type = "domain"
            elif "url" in ioc_type:
                indicator_type = "url"
            elif "sha256" in ioc_type or "md5" in ioc_type:
                indicator_type = "hash"
            else:
                continue
            result.append({"indicator_type": indicator_type, "value": value, "source": self.name})
        return result
