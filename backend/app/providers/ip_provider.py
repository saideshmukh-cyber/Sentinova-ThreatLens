import ipaddress


def analyze_ip(ip: str) -> dict:
    address = ipaddress.ip_address(ip)

    return {
        "ip": ip,
        "version": address.version,
        "is_private": address.is_private,
        "is_global": address.is_global,
        "is_loopback": address.is_loopback,
    }