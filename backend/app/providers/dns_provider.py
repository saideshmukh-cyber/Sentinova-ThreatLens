import requests


CLOUDFLARE_DNS_URL = "https://cloudflare-dns.com/dns-query"


def lookup_domain(domain: str) -> dict:
    result = {
        "domain": domain,
        "a_records": [],
        "aaaa_records": [],
    }

    headers = {
        "accept": "application/dns-json",
    }

    try:
        response = requests.get(
            CLOUDFLARE_DNS_URL,
            params={
                "name": domain,
                "type": "A",
            },
            headers=headers,
            timeout=5,
        )

        response.raise_for_status()

        data = response.json()

        for answer in data.get("Answer", []):
            if answer.get("type") == 1:
                result["a_records"].append(answer["data"])

    except Exception as exc:
        result["error"] = str(exc)

    try:
        response = requests.get(
            CLOUDFLARE_DNS_URL,
            params={
                "name": domain,
                "type": "AAAA",
            },
            headers=headers,
            timeout=5,
        )

        response.raise_for_status()

        data = response.json()

        for answer in data.get("Answer", []):
            if answer.get("type") == 28:
                result["aaaa_records"].append(answer["data"])

    except Exception as exc:
        result["aaaa_error"] = str(exc)

    return result