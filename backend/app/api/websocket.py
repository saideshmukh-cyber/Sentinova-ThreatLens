from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.app.config import settings
from backend.app.services.auth_service import decode_token
from backend.app.websocket.manager import manager

router = APIRouter(tags=["WebSocket"])


def _token_from_socket(websocket: WebSocket) -> str:
    # Browsers cannot set arbitrary Authorization headers during WebSocket creation.
    # The query-string form is retained for compatibility with the current frontend.
    token = websocket.query_params.get("token", "")
    if token:
        return token
    protocols = websocket.headers.get("sec-websocket-protocol", "")
    parts = [part.strip() for part in protocols.split(",") if part.strip()]
    return parts[-1] if len(parts) >= 2 and parts[0] == "threatlens" else ""


@router.websocket("/ws/alerts")
async def alerts_websocket(websocket: WebSocket):
    if settings.auth_required:
        claims = decode_token(_token_from_socket(websocket), expected_type="access")
        if not claims:
            await websocket.close(code=1008, reason="Authentication required")
            return

    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
