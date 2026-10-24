
import httpx

from backend.app.providers.base_feed_provider import BaseFeedProvider


class CISAKEVProvider(BaseFeedProvider):
    name = "cisa-kev"
    url = (
        "https://www.cisa.gov/sites/default/files/feeds/"
        "known_exploited_vulnerabilities.json"
    )

    def fetch_indicators(self) -> list[dict]:
        with httpx.Client(timeout=45.0, follow_redirects=True) as client:
            response = client.get(
                self.url,
                headers={"User-Agent": "Sentinova-ThreatLens/1.0"},
            )
            response.raise_for_status()

        payload = response.json()
        vulnerabilities = payload.get("vulnerabilities", [])

        if not isinstance(vulnerabilities, list):
            raise RuntimeError(
                "CISA KEV returned an unexpected vulnerabilities format."
            )

        result = []

        for row in vulnerabilities:
            if not isinstance(row, dict):
                continue

            cve_id = str(row.get("cveID", "")).strip().upper()

            if not cve_id:
                continue

            result.append(
                {
                    "indicator_type": "cve",
                    "value": cve_id,
                    "source": self.name,
                    "metadata": row,
                }
            )

        return result
