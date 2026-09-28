from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from backend.app.models.indicator import Indicator, IndicatorStatus


def expire_stale_indicators(db: Session) -> int:
    now = datetime.utcnow()
    rows = (
        db.query(Indicator)
        .filter(
            Indicator.status == IndicatorStatus.ACTIVE.value,
            Indicator.ttl_days.isnot(None),
        )
        .all()
    )
    expired = 0
    for indicator in rows:
        if indicator.last_seen + timedelta(days=int(indicator.ttl_days)) < now:
            indicator.status = IndicatorStatus.EXPIRED.value
            expired += 1
    if expired:
        db.commit()
    return expired
