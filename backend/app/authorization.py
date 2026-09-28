from fnmatch import fnmatch

ROLE_PERMISSIONS = {
    "admin": {"*"},
    "security_engineer": {
        "GET:*", "POST:/api/v1/feeds/*/run", "PUT:/api/v1/feeds/*",
        "POST:/api/v1/indicators", "PUT:/api/v1/indicators/*", "DELETE:/api/v1/indicators/*",
        "POST:/api/v1/relationships/*", "PUT:/api/v1/dashboard/layout",
        "POST:/api/v1/auth/users", "PUT:/api/v1/auth/users/*", "DELETE:/api/v1/auth/users/*",
    },
    "incident_responder": {
        "GET:*", "POST:/api/v1/security-events/", "POST:/api/v1/incidents/",
        "PUT:/api/v1/incidents/*", "PATCH:/api/v1/alerts/*", "POST:/api/v1/alerts/*",
    },
    "threat_hunter": {
        "GET:*", "POST:/api/v1/indicators/", "PUT:/api/v1/indicators/*",
        "POST:/api/v1/indicators/*/relationships", "PUT:/api/v1/dashboard/layout",
    },
    "analyst": {
        "GET:*", "POST:/api/v1/indicators/", "PUT:/api/v1/indicators/*",
        "POST:/api/v1/enrichments/*", "POST:/api/v1/security-events/",
        "PATCH:/api/v1/alerts/*", "POST:/api/v1/alerts/*/incident/*",
        "POST:/api/v1/indicators/*/relationships", "PUT:/api/v1/dashboard/layout",
    },
    "executive": {
        "GET:/api/v1/dashboard/*", "GET:/api/v1/alerts/*", "GET:/api/v1/incidents/*",
        "GET:/api/v1/reports/*", "GET:/api/v1/export/*", "GET:/api/v1/search*",
    },
}


def is_allowed(role: str, method: str, path: str) -> bool:
    if path.startswith("/api/v1/auth/users"):
        return role in {"admin", "security_engineer"}
    if path.startswith("/api/v1/audit"):
        return role in {"admin", "security_engineer", "incident_responder"}
    permissions = ROLE_PERMISSIONS.get(role, set())
    if "*" in permissions:
        return True
    key = f"{method.upper()}:{path}"
    if key in permissions:
        return True
    for permission in permissions:
        if permission.endswith(":*") and fnmatch(key, permission):
            return True
        if permission.endswith("*") and key.startswith(permission[:-1]):
            return True
    return False
