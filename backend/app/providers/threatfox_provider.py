
import httpx

from backend.app.config import settings
from backend.app.providers.base_feed_provider import BaseFeedProvider


class ThreatFoxProvider(BaseFeedProvider):
    name = "threatfox"
    url = "https://threatfox-api.abuse.ch/api/v1/"

    def fetch_indicators(self) -> list[dict]:
        api_key = settings.abusech_api_key.strip()

        if not api_key:
            raise RuntimeError(
                "ABUSECH_API_KEY is missing from the backend environment."
            )

        headers = {"Auth-Key": api_key}
        payload = {
            "query": "get_iocs",
            "days": 7,
        }

        with httpx.Client(timeout=45.0, follow_redirects=True) as client:
            response = client.post(
                self.url,
                headers=headers,
                json=payload,
            )
            response.raise_for_status()

        response_data = response.json()
        status = str(response_data.get("query_status", "")).lower()

        if status == "no_result":
            return []

        if status != "ok":
            raise RuntimeError(
                f"ThreatFox API returned status: {status or 'unknown'}"
            )

        rows = response_data.get("data", [])
        result = []

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
            elif "hash" in ioc_type:
                indicator_type = "hash"
            else:
                # Ignore IOC types not supported by ThreatLens.
                continue

            result.append(
                {
                    "indicator_type": indicator_type,
                    "value": str(value).strip(),
                    "source": self.name,
                }
            )

        return result
