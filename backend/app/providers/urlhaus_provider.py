import csv
from io import StringIO

import httpx


URLHAUS_FEED_URL = (
    "https://urlhaus.abuse.ch/downloads/csv_recent/"
)


class URLhausProvider:

    def fetch_indicators(self) -> list[dict]:
        try:
            with httpx.Client(
                timeout=30.0
            ) as client:
                response = client.get(
                    URLHAUS_FEED_URL
                )

        except httpx.RequestError:
            return []

        if response.status_code != 200:
            return []

        return self.parse_feed(
            response.text
        )

    @staticmethod
    def parse_feed(
        feed_text: str,
    ) -> list[dict]:
        indicators = []

        reader = csv.reader(
            StringIO(feed_text)
        )

        for row in reader:
            if not row:
                continue

            if row[0].startswith("#"):
                continue

            if len(row) < 3:
                continue

            url = row[2].strip()

            if not url:
                continue

            if not (
                url.startswith("http://")
                or url.startswith("https://")
            ):
                continue

            indicators.append(
                {
                    "indicator_type": "url",
                    "value": url,
                    "source": "urlhaus",
                }
            )

        return indicators