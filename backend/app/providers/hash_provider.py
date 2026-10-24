import re


def analyze_hash(value: str) -> dict:
    normalized = value.strip().lower()
    possible_types: list[str] = []

    if re.fullmatch(r"[0-9a-f]{32}", normalized):
        possible_types.append("MD5")
    elif re.fullmatch(r"[0-9a-f]{40}", normalized):
        possible_types.append("SHA1")
    elif re.fullmatch(r"[0-9a-f]{64}", normalized):
        possible_types.append("SHA256")

    return {
        "status": "ok" if possible_types else "invalid",
        "hash": normalized,
        "possible_types": possible_types,
        "is_valid_hash": bool(possible_types),
    }
