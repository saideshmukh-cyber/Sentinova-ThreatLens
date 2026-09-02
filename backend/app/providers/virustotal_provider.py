import httpx

from backend.app.providers.base import EnrichmentProvider


BASE_URL = "https://www.virustotal.com/api/v3"


class VirusTotalProvider(EnrichmentProvider):

    def __init__(self, api_key: str):
        self.api_key = api_key

    def enrich(
        self,
        value: str,
        indicator_type: str,
    ) -> dict:

        indicator_type = indicator_type.upper()

        endpoints = {
            "IP": f"{BASE_URL}/ip_addresses/{value}",
            "DOMAIN": f"{BASE_URL}/domains/{value}",
            "HASH": f"{BASE_URL}/files/{value}",
        }

        if indicator_type not in endpoints:
            raise ValueError(
                "VirusTotal currently supports IP, DOMAIN, and HASH"
            )

        try:
            with httpx.Client(timeout=15.0) as client:

                response = client.get(
                    endpoints[indicator_type],
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

        payload = response.json()

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