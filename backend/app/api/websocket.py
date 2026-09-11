from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.app.websocket.manager import manager


router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/alerts")
async def alerts_websocket(
    websocket: WebSocket,
):
    await manager.connect(websocket)

    try:
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        manager.disconnect(websocket)

    except Exception:
        manager.disconnect(websocket)