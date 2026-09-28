import uuid

from starlette.middleware.base import BaseHTTPMiddleware

from backend.app.config import settings
from backend.app.db.database import SessionLocal
from backend.app.services.audit_service import record_audit


class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        correlation_id = str(uuid.uuid4())
        request.state.correlation_id = correlation_id
        response = await call_next(request)
        if request.method in {"POST", "PUT", "PATCH", "DELETE"} and response.status_code < 500:
            try:
                db = SessionLocal()
                claims = getattr(request.state, "user", None) or {}
                actor = claims.get("sub") or request.headers.get("X-Actor") or "system"
                record_audit(
                    db,
                    actor=actor,
                    action=request.method.lower(),
                    entity_type=request.url.path.strip("/").split("/")[1] if request.url.path.startswith("/api/") else "admin",
                    entity_id=None,
                    details={"path": request.url.path, "status_code": response.status_code},
                    correlation_id=correlation_id,
                )
                db.close()
            except Exception:
                pass
        return response
