import base64

import httpx

from backend.app.providers.base import EnrichmentProvider


BASE_URL = "https://www.virustotal.com/api/v3"


class VirusTotalProvider(EnrichmentProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key.strip()

    @staticmethod
    def create_url_id(value: str) -> str:
        encoded = base64.urlsafe_b64encode(value.encode()).decode()
        return encoded.rstrip("=")

    def enrich(self, value: str, indicator_type: str) -> dict:
        indicator_type = indicator_type.strip().lower()
        value = value.strip()

        if not self.api_key:
            return {
                "status": "not_configured",
                "provider": "virustotal",
                "indicator_type": indicator_type,
                "value": value,
                "error": "VirusTotal API key is not configured",
            }

        if indicator_type == "url":
            endpoint = f"{BASE_URL}/urls/{self.create_url_id(value)}"
        elif indicator_type == "ip":
            endpoint = f"{BASE_URL}/ip_addresses/{value}"
        elif indicator_type == "domain":
            endpoint = f"{BASE_URL}/domains/{value}"
        elif indicator_type in {"hash", "hash_md5", "hash_sha1", "hash_sha256"}:
            endpoint = f"{BASE_URL}/files/{value}"
        else:
            return {
                "status": "unsupported",
                "provider": "virustotal",
                "indicator_type": indicator_type,
                "value": value,
                "error": "Unsupported VirusTotal indicator type",
            }

        try:
            with httpx.Client(timeout=15.0) as client:
                response = client.get(
                    endpoint,
                    headers={"x-apikey": self.api_key, "Accept": "application/json"},
                )
        except httpx.RequestError as exc:
            return {
                "status": "error",
                "provider": "virustotal",
                "indicator_type": indicator_type,
                "value": value,
                "error": f"VirusTotal request failed: {exc}",
            }

        if response.status_code == 401:
            return {"status": "error", "provider": "virustotal", "error": "Invalid VirusTotal API key"}
        if response.status_code == 404:
            return {"status": "not_found", "provider": "virustotal", "indicator_type": indicator_type, "value": value}
        if response.status_code == 429:
            return {"status": "rate_limited", "provider": "virustotal", "error": "VirusTotal rate limit reached"}
        if response.status_code >= 400:
            return {"status": "error", "provider": "virustotal", "error": f"VirusTotal returned HTTP {response.status_code}"}

        try:
            attributes = response.json().get("data", {}).get("attributes", {})
        except ValueError:
            return {"status": "error", "provider": "virustotal", "error": "VirusTotal returned invalid JSON"}

        stats = attributes.get("last_analysis_stats") or {}
        return {
            "status": "ok",
            "provider": "virustotal",
            "indicator_type": indicator_type,
            "value": value,
            "reputation": int(attributes.get("reputation") or 0),
            "malicious": int(stats.get("malicious") or 0),
            "suspicious": int(stats.get("suspicious") or 0),
            "harmless": int(stats.get("harmless") or 0),
            "undetected": int(stats.get("undetected") or 0),
            "timeout": int(stats.get("timeout") or 0),
            "last_analysis_stats": stats,
        }
