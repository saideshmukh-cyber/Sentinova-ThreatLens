from sqlalchemy.orm import Session

from backend.app.models.indicator import Indicator
from backend.app.models.security_event import (
    SecurityEvent,
)
from backend.app.services.alert_service import (
    generate_alert_for_indicator,
)


def find_matching_indicator(
    db: Session,
    event: SecurityEvent,
):
    return (
        db.query(Indicator)
        .filter(
            Indicator.value
            == event.indicator_value,
        )
        .first()
    )


def correlate_event(
    db: Session,
    event: SecurityEvent,
):
    indicator = find_matching_indicator(
        db,
        event,
    )

    if indicator is None:
        return None

    alert = generate_alert_for_indicator(
        db=db,
        indicator=indicator,
        rule=(
            f"Indicator matched internal "
            f"{event.source} event"
        ),
    )

    return alert