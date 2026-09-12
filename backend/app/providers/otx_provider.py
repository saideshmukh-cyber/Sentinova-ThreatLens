import json
import os
import urllib.request

from backend.app.providers.base_feed_provider import (
    BaseFeedProvider,
)


class OTXProvider(BaseFeedProvider):
    name = "otx"
    description = "AlienVault Open Threat Exchange."

    def fetch_indicators(self) -> list[dict]:
        api_key = os.getenv(
            "OTX_API_KEY",
            "",
        ).strip()

        if not api_key:
            return []

        url = (
            "https://otx.alienvault.com/"
            "api/v1/pulses/subscribed"
        )

        request = urllib.request.Request(
            url,
            headers={
                "X-OTX-API-KEY": api_key,
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

        for pulse in payload.get(
            "results",
            [],
        ):
            for indicator in pulse.get(
                "indicators",
                [],
            ):
                indicator_type = (
                    indicator.get("type")
                )

                value = indicator.get(
                    "indicator"
                )

                if not value:
                    continue

                mapped_type = None

                if indicator_type in {
                    "IPv4",
                    "IPv6",
                }:
                    mapped_type = "ip"

                elif indicator_type in {
                    "domain",
                    "hostname",
                }:
                    mapped_type = "domain"

                elif indicator_type == "URL":
                    mapped_type = "url"

                elif indicator_type in {
                    "FileHash-MD5",
                    "FileHash-SHA256",
                }:
                    mapped_type = "hash"

                if mapped_type:
                    results.append(
                        {
                            "indicator_type": mapped_type,
                            "value": value,
                        }
                    )

        return results