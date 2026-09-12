import json
import urllib.request

from backend.app.providers.base_feed_provider import (
    BaseFeedProvider,
)


class CISAKEVProvider(BaseFeedProvider):
    name = "cisa-kev"
    description = (
        "CISA Known Exploited Vulnerabilities catalog."
    )

    url = (
        "https://www.cisa.gov/sites/default/files/"
        "feeds/known_exploited_vulnerabilities.json"
    )

    def fetch_indicators(self) -> list[dict]:
        request = urllib.request.Request(
            self.url,
            headers={
                "User-Agent": "ThreatLens/1.0",
            },
        )

        with urllib.request.urlopen(
            request,
            timeout=15,
        ) as response:
            payload = json.loads(
                response.read().decode("utf-8")
            )

        results = []

        for item in payload.get(
            "vulnerabilities",
            [],
        ):
            cve = item.get(
                "cveID"
            )

            if cve:
                results.append(
                    {
                        "indicator_type": "cve",
                        "value": cve,
                    }
                )

        return results