import json
import urllib.request

from backend.app.providers.base_feed_provider import (
    BaseFeedProvider,
)


class FeodoProvider(BaseFeedProvider):
    name = "feodo"
    description = "Abuse.ch Feodo Tracker IP blocklist."

    url = (
        "https://feodotracker.abuse.ch/"
        "downloads/ipblocklist.json"
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

        for item in payload:
            ip = item.get("ip_address")

            if ip:
                results.append(
                    {
                        "indicator_type": "ip",
                        "value": ip,
                    }
                )

        return results