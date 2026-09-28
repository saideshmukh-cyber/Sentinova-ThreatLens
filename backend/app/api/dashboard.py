from fastapi import APIRouter, Depends, Request
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.models.alert import Alert, AlertStatus
from backend.app.models.incident import Incident
from backend.app.models.indicator import Indicator, IndicatorType
from backend.app.models.investigation import Investigation
from backend.app.models.security_event import SecurityEvent
from backend.app.models.user import User
from backend.app.schemas.dashboard import DashboardLayout
from backend.app.services.dashboard_service import get_dashboard_analytics

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _get_user(request: Request, db: Session):
    claims = getattr(request.state, "user", None) or {}
    username = claims.get("sub")
    if username:
        user = db.query(User).filter(User.username == username).first()
        if user:
            return user
    return None


@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_indicators = db.query(func.count(Indicator.id)).scalar() or 0
    total_investigations = db.query(func.count(Investigation.id)).scalar() or 0
    high_risk_investigations = db.query(func.count(Investigation.id)).filter(Investigation.risk_level.in_(["HIGH", "CRITICAL"])).scalar() or 0
    total_alerts = db.query(func.count(Alert.id)).scalar() or 0
    open_alerts = db.query(func.count(Alert.id)).filter(Alert.status.in_([AlertStatus.NEW, AlertStatus.ACKNOWLEDGED, AlertStatus.IN_PROGRESS])).scalar() or 0
    total_incidents = db.query(func.count(Incident.id)).scalar() or 0
    open_incidents = db.query(func.count(Incident.id)).filter(Incident.status.in_(["open", "in-progress"])).scalar() or 0
    total_security_events = db.query(func.count(SecurityEvent.id)).scalar() or 0
    indicator_distribution = {indicator_type.value: db.query(func.count(Indicator.id)).filter(Indicator.indicator_type == indicator_type).scalar() or 0 for indicator_type in IndicatorType}
    recent_alerts = db.query(Alert).order_by(Alert.created_at.desc()).limit(10).all()
    return {
        "total_indicators": total_indicators,
        "total_investigations": total_investigations,
        "high_risk_investigations": high_risk_investigations,
        "total_alerts": total_alerts,
        "open_alerts": open_alerts,
        "total_incidents": total_incidents,
        "open_incidents": open_incidents,
        "total_security_events": total_security_events,
        "indicator_distribution": indicator_distribution,
        "recent_alerts": [
            {"id": alert.id, "indicator_id": alert.indicator_id, "severity_score": alert.severity_score, "rule": alert.rule, "status": alert.status.value, "assignee": alert.assignee, "created_at": alert.created_at.isoformat()}
            for alert in recent_alerts
        ],
    }


@router.get("/analytics")
def dashboard_analytics(db: Session = Depends(get_db)):
    return get_dashboard_analytics(db)


@router.get("/layout")
def get_layout(request: Request, db: Session = Depends(get_db)):
    user = _get_user(request, db)
    if user is None:
        return {"visible": {}}
    return {"visible": user.dashboard_layout or {}}


@router.put("/layout")
def save_layout(data: DashboardLayout, request: Request, db: Session = Depends(get_db)):
    user = _get_user(request, db)
    if user is None:
        return {"visible": data.visible, "saved": False}
    user.dashboard_layout = data.visible
    db.commit()
    return {"visible": user.dashboard_layout, "saved": True}
