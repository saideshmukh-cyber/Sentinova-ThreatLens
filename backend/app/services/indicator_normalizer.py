from urllib.parse import urlparse


def normalize_indicator(indicator_type, value: str) -> str:
    value = value.strip()
    if hasattr(indicator_type, "value"):
        indicator_type = indicator_type.value
    indicator_type = indicator_type.strip().lower()
    if indicator_type == "domain":
        return value.lower().rstrip(".")
    if indicator_type == "url":
        parsed = urlparse(value.lower())
        hostname = parsed.hostname or ""
        if parsed.port:
            hostname = f"{hostname}:{parsed.port}"
        normalized_url = f"{parsed.scheme}://{hostname}{parsed.path.rstrip('/') }"
        if parsed.query:
            normalized_url += f"?{parsed.query}"
        if parsed.fragment:
            normalized_url += f"#{parsed.fragment}"
        return normalized_url
    if indicator_type in {"ip", "hash", "email", "cve"}:
        return value.lower()
    return value
