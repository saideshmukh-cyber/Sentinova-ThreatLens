from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.app.config import settings
from backend.app.services.auth_service import decode_token
from backend.app.websocket.manager import manager

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/alerts")
async def alerts_websocket(websocket: WebSocket):
    if settings.auth_required:
        token = websocket.query_params.get("token", "")
        if not decode_token(token):
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
