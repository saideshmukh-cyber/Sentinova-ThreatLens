import hashlib


def analyze_hash(value: str) -> dict:
    value = value.strip().lower()

    result = {
        "hash": value,
        "possible_types": [],
    }

    if len(value) == 32:
        result["possible_types"].append("MD5")

    if len(value) == 40:
        result["possible_types"].append("SHA1")

    if len(value) == 64:
        result["possible_types"].append("SHA256")

    return result