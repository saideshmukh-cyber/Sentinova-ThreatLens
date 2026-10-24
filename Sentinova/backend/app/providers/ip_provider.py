import ipaddress

import httpx

from backend.app.config import settings


IP_GEO_URL = "https://ipwho.is/{ip}"
ABUSEIPDB_URL = "https://api.abuseipdb.com/api/v2/check"


def analyze_ip(ip: str) -> dict:
    """Return local IP facts plus best-effort geo/ASN and AbuseIPDB data.

    External failures are recorded in the response instead of raising so an
    enrichment provider outage cannot break IOC processing.
    """
    normalized_ip = ip.strip()
    address = ipaddress.ip_address(normalized_ip)

    result: dict = {
        "ip": normalized_ip,
        "version": address.version,
        "is_private": address.is_private,
        "is_global": address.is_global,
        "is_loopback": address.is_loopback,
        "geo": {},
        "abuseipdb": {},
    }

    if not address.is_global:
        result["geo"] = {"status": "not_applicable", "reason": "non_global_ip"}
        result["abuseipdb"] = {"status": "not_applicable", "reason": "non_global_ip"}
        return result

    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.get(IP_GEO_URL.format(ip=normalized_ip))
            response.raise_for_status()
            payload = response.json()
        result["geo"] = {
            "status": "ok" if payload.get("success", True) else "error",
            "country": payload.get("country"),
            "country_code": payload.get("country_code"),
            "region": payload.get("region"),
            "city": payload.get("city"),
            "latitude": payload.get("latitude"),
            "longitude": payload.get("longitude"),
            "timezone": payload.get("timezone", {}).get("id") if isinstance(payload.get("timezone"), dict) else payload.get("timezone"),
            "asn": payload.get("connection", {}).get("asn") if isinstance(payload.get("connection"), dict) else None,
            "organization": payload.get("connection", {}).get("org") if isinstance(payload.get("connection"), dict) else None,
            "isp": payload.get("connection", {}).get("isp") if isinstance(payload.get("connection"), dict) else None,
        }
    except Exception as exc:
        result["geo"] = {"status": "error", "error": str(exc)}

    api_key = getattr(settings, "abuseipdb_api_key", "")
    if not api_key:
        result["abuseipdb"] = {"status": "not_configured"}
        return result

    try:
        with httpx.Client(timeout=8.0) as client:
            response = client.get(
                ABUSEIPDB_URL,
                params={"ipAddress": normalized_ip, "maxAgeInDays": 90},
                headers={"Key": api_key, "Accept": "application/json"},
            )
            response.raise_for_status()
            data = response.json().get("data", {})
        result["abuseipdb"] = {
            "status": "ok",
            "abuse_confidence_score": data.get("abuseConfidenceScore"),
            "total_reports": data.get("totalReports"),
            "last_reported_at": data.get("lastReportedAt"),
            "usage_type": data.get("usageType"),
            "isp": data.get("isp"),
            "domain": data.get("domain"),
        }
    except Exception as exc:
        result["abuseipdb"] = {"status": "error", "error": str(exc)}

    return result
