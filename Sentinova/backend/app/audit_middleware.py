import uuid

from starlette.middleware.base import BaseHTTPMiddleware

from backend.app.db.database import SessionLocal
from backend.app.services.audit_service import record_audit


def get_audit_action(method: str, path: str) -> str:
    method = method.upper()

    if method == "POST":
        if path.startswith("/api/v1/alerts/") and path.endswith("/escalate"):
            return "alert_escalated"

        if path.startswith("/api/v1/alerts/") and path.endswith("/incident"):
            return "incident_created_from_alert"

        if "/incident/" in path and path.startswith("/api/v1/alerts/"):
            return "alert_attached_to_incident"

        return "create"

    if method == "PATCH":
        if path.startswith("/api/v1/alerts/"):
            return "alert_updated"

        return "update"

    if method == "PUT":
        return "update"

    if method == "DELETE":
        return "delete"

    return method.lower()


class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        correlation_id = str(uuid.uuid4())
        request.state.correlation_id = correlation_id

        response = await call_next(request)

        if request.method in {"POST", "PUT", "PATCH", "DELETE"} and response.status_code < 500:
            db = None

            try:
                db = SessionLocal()

                claims = getattr(request.state, "user", None) or {}

                actor = (
                    claims.get("sub")
                    or request.headers.get("X-Actor")
                    or "system"
                )

                action = get_audit_action(
                    request.method,
                    request.url.path,
                )

                entity_type = "unknown"
                entity_id = None

                path_parts = [
                    part
                    for part in request.url.path.strip("/").split("/")
                    if part
                ]

                if len(path_parts) >= 3 and path_parts[0] == "api":
                    entity_type = path_parts[2]

                # /api/v1/alerts/{id}/...
                if (
                    len(path_parts) >= 4
                    and path_parts[0] == "api"
                    and path_parts[1] == "v1"
                    and path_parts[2] == "alerts"
                ):
                    entity_id = path_parts[3]

                record_audit(
                    db,
                    actor=actor,
                    action=action,
                    entity_type=entity_type,
                    entity_id=entity_id,
                    details={
                        "path": request.url.path,
                        "method": request.method,
                        "status_code": response.status_code,
                    },
                    correlation_id=correlation_id,
                )

            except Exception:
                # Audit failures must not break the user's API request.
                pass

            finally:
                if db is not None:
                    db.close()

        return response