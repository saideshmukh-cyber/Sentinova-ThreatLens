from datetime import datetime
from io import BytesIO

from fastapi import APIRouter, Depends, Query
from fastapi.responses import HTMLResponse, Response
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.models.alert import Alert, AlertStatus
from backend.app.models.incident import Incident
from backend.app.models.indicator import Indicator
from backend.app.services.dashboard_service import get_dashboard_analytics

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _report_data(db: Session):
    analytics = get_dashboard_analytics(db)
    total_indicators = db.query(Indicator).count()
    total_alerts = db.query(Alert).count()
    open_alerts = db.query(Alert).filter(Alert.status.in_([AlertStatus.NEW, AlertStatus.ACKNOWLEDGED, AlertStatus.IN_PROGRESS])).count()
    incidents = db.query(Incident).count()
    return analytics, total_indicators, total_alerts, open_alerts, incidents


def _rows_html(analytics):
    return "".join(
        f"<tr><td>{item['id']}</td><td>{item['indicator_type'].upper()}</td><td>{item['value']}</td><td>{item['severity_score']}</td></tr>"
        for item in analytics["top_indicators"]
    )


def _html(title: str, analytics, total_indicators: int, total_alerts: int, open_alerts: int, incidents: int) -> str:
    generated = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    return f"""
<!doctype html><html><head><meta charset='utf-8'><title>{title}</title>
<style>
body{{font-family:Inter,Arial,sans-serif;background:#08111a;color:#e8f0f7;margin:0;padding:40px}}
.container{{max-width:1100px;margin:auto}}h1{{font-size:30px}}.muted{{color:#8da0b3}}
.grid{{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:24px 0}}
.card{{border:1px solid #203245;background:#0d1824;border-radius:14px;padding:18px}}.value{{font-size:30px;font-weight:700;margin-top:8px}}
table{{width:100%;border-collapse:collapse;background:#0d1824;border-radius:14px;overflow:hidden}}th,td{{text-align:left;padding:11px;border-bottom:1px solid #1d2c3c;font-size:13px}}th{{color:#8da0b3;text-transform:uppercase;font-size:10px;letter-spacing:.12em}}
@media(max-width:800px){{.grid{{grid-template-columns:1fr 1fr}}body{{padding:20px}}}}
</style></head><body><div class='container'>
<div class='muted'>THREATLENS · EXECUTIVE REPORT</div><h1>{title}</h1><div class='muted'>Generated {generated}</div>
<div class='grid'>
<div class='card'><div class='muted'>Risk score</div><div class='value'>{analytics['risk_score']}</div></div>
<div class='card'><div class='muted'>Indicators</div><div class='value'>{total_indicators:,}</div></div>
<div class='card'><div class='muted'>Open alerts</div><div class='value'>{open_alerts:,}</div></div>
<div class='card'><div class='muted'>Incidents</div><div class='value'>{incidents:,}</div></div></div>
<div class='card'><h2>Posture summary</h2><p class='muted'>Critical/high indicators: {analytics['active_critical_high']:,}. Total alerts: {total_alerts:,}. Resolved alerts: {analytics['resolved_alerts']:,}.</p></div>
<div style='height:20px'></div><h2>Priority indicators</h2><table><thead><tr><th>ID</th><th>Type</th><th>Value</th><th>Severity</th></tr></thead><tbody>{_rows_html(analytics)}</tbody></table>
<p class='muted' style='margin-top:24px'>ThreatLens executive report.</p>
</div></body></html>"""


@router.get("/executive", response_class=HTMLResponse)
def executive_report(db: Session = Depends(get_db), title: str = Query("ThreatLens Executive Threat Report", max_length=200)):
    analytics, total_indicators, total_alerts, open_alerts, incidents = _report_data(db)
    return HTMLResponse(_html(title, analytics, total_indicators, total_alerts, open_alerts, incidents))


@router.get("/executive.pdf")
def executive_pdf(db: Session = Depends(get_db)):
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
    except ImportError as exc:
        return Response(content="reportlab is required for PDF reports. Run pip install -r backend/requirements.txt", status_code=503, media_type="text/plain")

    analytics, total_indicators, total_alerts, open_alerts, incidents = _report_data(db)
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 50
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(45, y, "ThreatLens Executive Threat Report")
    y -= 24
    pdf.setFont("Helvetica", 9)
    pdf.drawString(45, y, datetime.utcnow().strftime("Generated %Y-%m-%d %H:%M UTC"))
    y -= 35
    metrics = [
        ("Risk score", analytics["risk_score"]),
        ("Indicators", total_indicators),
        ("Open alerts", open_alerts),
        ("Incidents", incidents),
    ]
    pdf.setFont("Helvetica-Bold", 11)
    for label, value in metrics:
        pdf.drawString(55, y, f"{label}: {value}")
        y -= 18
    y -= 10
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(45, y, "Priority indicators")
    y -= 20
    pdf.setFont("Helvetica", 9)
    for item in analytics["top_indicators"][:10]:
        text = f"#{item['id']}  {item['indicator_type'].upper():6}  {item['value'][:70]}  score={item['severity_score']}"
        pdf.drawString(45, y, text)
        y -= 14
        if y < 55:
            pdf.showPage()
            y = height - 50
            pdf.setFont("Helvetica", 9)
    pdf.save()
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=threatlens-executive-report.pdf"},
    )
