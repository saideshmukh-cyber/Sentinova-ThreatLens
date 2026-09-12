from backend.app.websocket.manager import (
    manager,
)


HIGH_SEVERITY_THRESHOLD = 80


async def broadcast_high_severity_indicator(
    indicator,
    confidence: int,
):
    if confidence < HIGH_SEVERITY_THRESHOLD:
        return

    await manager.broadcast(
        {
            "event": (
                "indicators.high_severity"
            ),
            "data": {
                "indicator": {
                    "id": indicator.id,
                    "indicator_type": (
                        indicator.indicator_type.value
                    ),
                    "value": indicator.value,
                    "confidence": confidence,
                    "created_at": (
                        indicator.created_at.isoformat()
                        if indicator.created_at
                        else None
                    ),
                }
            },
        }
    )