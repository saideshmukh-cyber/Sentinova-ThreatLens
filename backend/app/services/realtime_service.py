from backend.app.services.realtime_bus import publish_event

HIGH_SEVERITY_THRESHOLD = 80


async def broadcast_high_severity_indicator(indicator):
    score = int(indicator.severity_score or 0)
    if score < HIGH_SEVERITY_THRESHOLD:
        return
    await publish_event({
        "event": "indicators.high_severity",
        "channel": "indicators.high_severity",
        "data": {
            "indicator": {
                "id": indicator.id,
                "indicator_type": indicator.indicator_type.value,
                "value": indicator.value,
                "severity_score": score,
                "created_at": indicator.created_at.isoformat() if indicator.created_at else None,
            }
        },
    })


async def broadcast_if_high_severity(indicator, previous_score: int):
    current_score = int(indicator.severity_score or 0)
    if previous_score < HIGH_SEVERITY_THRESHOLD <= current_score:
        await broadcast_high_severity_indicator(indicator)
