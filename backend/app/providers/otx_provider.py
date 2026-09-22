import httpx
from backend.app.providers.base_feed_provider import BaseFeedProvider


class OTXProvider(BaseFeedProvider):
    name = "otx"
    url = "https://otx.alienvault.com/api/v1/pulses/subscribed"

    def __init__(self, api_key: str = ""):
        self.api_key = api_key

    def fetch_indicators(self) -> list[dict]:
        if not self.api_key:
            return []
        with httpx.Client(timeout=45.0) as client:
            response = client.get(self.url, headers={"X-OTX-API-KEY": self.api_key})
            response.raise_for_status()
        result = []
        for pulse in response.json().get("results", []):
            for indicator in pulse.get("indicators", []):
                value = str(indicator.get("indicator", "")).strip()
                kind = str(indicator.get("type", "")).lower()
                if not value:
                    continue
                if "ipv4" in kind or "ipv6" in kind:
                    indicator_type = "ip"
                elif "domain" in kind:
                    indicator_type = "domain"
                elif "url" in kind:
                    indicator_type = "url"
                elif "hash" in kind or "file" in kind:
                    indicator_type = "hash"
                else:
                    continue
                result.append({"indicator_type": indicator_type, "value": value, "source": self.name})
        return result
