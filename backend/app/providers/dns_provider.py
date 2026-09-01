import socket


def lookup_domain(domain: str) -> dict:
    result = {
        "domain": domain,
        "a_records": [],
        "status": "unknown",
    }

    try:
        addresses = socket.getaddrinfo(
            domain,
            None,
            socket.AF_INET,
        )

        for address in addresses:
            ip_address = address[4][0]

            if ip_address not in result["a_records"]:
                result["a_records"].append(ip_address)

        if result["a_records"]:
            result["status"] = "success"
        else:
            result["status"] = "no_records"

    except socket.gaierror:
        result["status"] = "dns_unavailable"

    except Exception as exc:
        result["status"] = "error"
        result["error"] = str(exc)

    return result