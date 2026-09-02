from urllib.parse import urlparse


def normalize_indicator(indicator_type, value: str) -> str:
    """
    Normalize an indicator value before storing it.
    """

    value = value.strip()

    if hasattr(indicator_type, "value"):
        indicator_type = indicator_type.value

    indicator_type = indicator_type.strip().lower()

    if indicator_type == "domain":
        return value.lower().rstrip(".")

    if indicator_type == "url":
        parsed = urlparse(value)

        scheme = parsed.scheme.lower()

        hostname = parsed.hostname.lower() if parsed.hostname else ""

        if parsed.port:
            hostname = f"{hostname}:{parsed.port}"

        path = parsed.path.rstrip("/")

        normalized_url = f"{scheme}://{hostname}{path}"

        if parsed.query:
            normalized_url += f"?{parsed.query}"

        return normalized_url

    if indicator_type == "ip":
        return value.strip()

    if indicator_type == "hash":
        return value.lower()

    return value