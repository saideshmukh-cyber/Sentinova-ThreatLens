import json
import urllib.request

from backend.app.providers.base_feed_provider import (
    BaseFeedProvider,
)


class ThreatFoxProvider(BaseFeedProvider):
    name = "threatfox"
    description = "Abuse.ch ThreatFox IOC feed."

    url = (
        "https://threatfox.abuse.ch/"
        "export/json/recent/"
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

        for item in payload.get("data", []):
            ioc_type = item.get("ioc_type")
            value = item.get("ioc")

            if not value:
                continue

            if ioc_type == "ip:port":
                value = value.split(":")[0]
                ioc_type = "ip"

            if ioc_type in {
                "ip",
                "domain",
                "url",
            }:
                results.append(
                    {
                        "indicator_type": ioc_type,
                        "value": value,
                    }
                )

        return results