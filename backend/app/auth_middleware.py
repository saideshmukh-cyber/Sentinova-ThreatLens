from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from backend.app.authorization import is_allowed
from backend.app.config import settings
from backend.app.services.auth_service import decode_token

PUBLIC = {
    "/",
    "/health/database",
    "/health/elasticsearch",
    "/api/v1/auth/login",
    "/api/v1/auth/refresh",
    "/docs",
    "/openapi.json",
    "/redoc",
}


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        if request.url.path in PUBLIC or not settings.auth_required:
            return await call_next(request)

        authorization = request.headers.get("Authorization", "")
        if not authorization.lower().startswith("bearer "):
            return JSONResponse({"detail": "Authentication required"}, status_code=401)

        token = authorization.split(" ", 1)[1].strip()
        claims = decode_token(token, expected_type="access")
        if not claims:
            return JSONResponse({"detail": "Invalid or expired token"}, status_code=401)

        role = str(claims.get("role", ""))
        if not is_allowed(role, request.method, request.url.path):
            return JSONResponse({"detail": "Insufficient permissions"}, status_code=403)

        request.state.user = claims
        return await call_next(request)
