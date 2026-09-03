import base64

import httpx

from backend.app.providers.base import EnrichmentProvider


BASE_URL = "https://www.virustotal.com/api/v3"


class VirusTotalProvider(EnrichmentProvider):

    def __init__(self, api_key: str):
        self.api_key = api_key

    @staticmethod
    def create_url_id(value: str) -> str:
        encoded = base64.urlsafe_b64encode(
            value.encode()
        ).decode()

        return encoded.rstrip("=")

    def enrich(
        self,
        value: str,
        indicator_type: str,
    ) -> dict:

        indicator_type = indicator_type.strip().upper()
        value = value.strip()

        if indicator_type == "URL":
            url_id = self.create_url_id(value)

            endpoint = f"{BASE_URL}/urls/{url_id}"

        elif indicator_type == "IP":
            endpoint = f"{BASE_URL}/ip_addresses/{value}"

        elif indicator_type == "DOMAIN":
            endpoint = f"{BASE_URL}/domains/{value}"

        elif indicator_type == "HASH":
            endpoint = f"{BASE_URL}/files/{value}"

        else:
            return {
                "status": "error",
                "error": "Unsupported VirusTotal indicator type",
            }

        try:
            with httpx.Client(timeout=15.0) as client:
                response = client.get(
                    endpoint,
                    headers={
                        "x-apikey": self.api_key,
                        "Accept": "application/json",
                    },
                )

        except httpx.RequestError:
            return {
                "status": "error",
                "error": "VirusTotal request failed",
            }

        if response.status_code == 401:
            return {
                "status": "error",
                "error": "Invalid VirusTotal API key",
            }

        if response.status_code == 404:
            return {
                "status": "not_found",
                "error": "Indicator not found in VirusTotal",
            }

        if response.status_code == 429:
            return {
                "status": "error",
                "error": "VirusTotal rate limit reached",
            }

        if response.status_code >= 500:
            return {
                "status": "error",
                "error": "VirusTotal server error",
            }

        if response.status_code >= 400:
            return {
                "status": "error",
                "error": "VirusTotal request failed",
            }

        try:
            payload = response.json()

        except ValueError:
            return {
                "status": "error",
                "error": "VirusTotal returned invalid JSON",
            }

        data = payload.get("data", {})
        attributes = data.get("attributes", {})

        return {
            "status": "ok",
            "provider": "virustotal",
            "indicator_type": indicator_type,
            "value": value,
            "reputation": attributes.get("reputation"),
            "last_analysis_stats": attributes.get(
                "last_analysis_stats",
                {},
            ),
        }