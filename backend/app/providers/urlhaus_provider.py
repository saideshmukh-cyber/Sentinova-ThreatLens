import csv
import io
import urllib.request

from backend.app.providers.base_feed_provider import (
    BaseFeedProvider,
)


class URLhausProvider(BaseFeedProvider):
    name = "urlhaus"
    description = "Abuse.ch URLhaus malicious URL feed."

    url = (
        "https://urlhaus.abuse.ch/"
        "downloads/csv_recent/"
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
            content = response.read().decode(
                "utf-8",
                errors="ignore",
            )

        results = []

        reader = csv.reader(
            io.StringIO(content)
        )

        for row in reader:
            if not row:
                continue

            if row[0].startswith("#"):
                continue

            if len(row) < 3:
                continue

            url = row[2].strip()

            if not (
                url.startswith("http://")
                or url.startswith("https://")
            ):
                continue

            results.append(
                {
                    "indicator_type": "url",
                    "value": url,
                }
            )

        return results