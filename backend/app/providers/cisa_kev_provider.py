import httpx
from backend.app.providers.base_feed_provider import BaseFeedProvider


class CISAKEVProvider(BaseFeedProvider):
    name = "cisa-kev"
    url = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"

    def fetch_indicators(self) -> list[dict]:
        with httpx.Client(timeout=45.0) as client:
            response = client.get(self.url)
            response.raise_for_status()
        vulnerabilities = response.json().get("vulnerabilities", [])
        # Current ThreatLens IndicatorType has no CVE type, so KEV metadata is
        # returned separately and is not inserted as an unsupported indicator.
        return [
            {
                "indicator_type": "unsupported",
                "value": str(row.get("cveID", "")).strip().lower(),
                "source": self.name,
                "metadata": row,
            }
            for row in vulnerabilities
            if row.get("cveID")
        ]
