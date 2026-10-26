
import httpx

from backend.app.config import settings
from backend.app.providers.base_feed_provider import BaseFeedProvider


class URLhausProvider(BaseFeedProvider):
    name = "urlhaus"
    description = "Abuse.ch URLhaus malicious URL feed."
    url = "https://urlhaus-api.abuse.ch/v1/urls/recent/"

    def fetch_indicators(self) -> list[dict]:
        api_key = settings.abusech_api_key.strip()

        if not api_key:
            raise RuntimeError(
                "ABUSECH_API_KEY is missing from the backend environment."
            )

        try:
            with httpx.Client(timeout=45.0) as client:
                response = client.post(
                    self.url,
                    headers={"Auth-Key": api_key},
                    data={"limit": 1000},
                )
                response.raise_for_status()
                payload = response.json()
        except httpx.HTTPStatusError as exc:
            raise RuntimeError(
                f"URLhaus API returned HTTP {exc.response.status_code}."
            ) from None
        except httpx.RequestError:
            raise RuntimeError(
                "Unable to connect to the URLhaus API."
            ) from None

        status = str(payload.get("query_status", "")).lower()

        if status in {"no_results", "no_result"}:
            return []

        if status != "ok":
            raise RuntimeError(
                f"URLhaus API returned status: {status or 'unknown'}."
            )

        results = []

        for row in payload.get("urls", []):
            if not isinstance(row, dict):
                continue

            value = str(row.get("url", "")).strip()

            if not value.startswith(("http://", "https://")):
                continue

            results.append(
                {
                    "indicator_type": "url",
                    "value": value,
                    "source": self.name,
                }
            )

        return results
