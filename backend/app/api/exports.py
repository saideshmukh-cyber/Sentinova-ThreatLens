import csv
import io
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.models.indicator import Indicator

router = APIRouter(prefix="/api/v1/export", tags=["Export"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _query(db: Session, query: str | None, indicator_type: str | None):
    q = db.query(Indicator)
    if query:
        q = q.filter(Indicator.value.ilike(f"%{query.strip()}%"))
    if indicator_type:
        q = q.filter(Indicator.indicator_type == indicator_type.strip().lower())
    return q.order_by(Indicator.severity_score.desc(), Indicator.created_at.desc())


def _stix_pattern(indicator: Indicator):
    value = indicator.value.replace("'", "\\'")
    kind = indicator.indicator_type.value
    if kind == "ip":
        return f"[ip-addr:value = '{value}']"
    if kind == "domain":
        return f"[domain-name:value = '{value}']"
    if kind == "url":
        return f"[url:value = '{value}']"
    if kind == "email":
        return f"[email-addr:value = '{value}']"
    if kind == "hash":
        if len(value) == 64:
            return f"[file:hashes.SHA-256 = '{value}']"
        if len(value) == 40:
            return f"[file:hashes.SHA-1 = '{value}']"
        return f"[file:hashes.MD5 = '{value}']"
    return f"[vulnerability:name = '{value}']"


@router.get("/csv")
def export_csv(query: str | None = None, indicator_type: str | None = None, db: Session = Depends(get_db)):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id", "value", "indicator_type", "severity_score", "confidence", "tlp", "status", "tags", "attack_techniques", "notes", "ttl_days", "first_seen", "last_seen",
    ])
    for item in _query(db, query, indicator_type).all():
        writer.writerow([
            item.id,
            item.value,
            item.indicator_type.value,
            item.severity_score,
            item.confidence,
            item.tlp,
            item.status,
            ";".join(item.tags or []),
            ";".join(item.attack_techniques or []),
            item.notes or "",
            item.ttl_days,
            item.first_seen.isoformat(),
            item.last_seen.isoformat(),
        ])
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=threatlens-indicators.csv"},
    )


@router.get("/stix")
def export_stix(query: str | None = None, indicator_type: str | None = None, db: Session = Depends(get_db)):
    objects = []
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    for item in _query(db, query, indicator_type).all():
        objects.append({
            "type": "indicator",
            "spec_version": "2.1",
            "id": f"indicator--{item.id:032x}",
            "created": now,
            "modified": now,
            "pattern_type": "stix",
            "pattern": _stix_pattern(item),
            "valid_from": now,
            "labels": ["threatlens", item.indicator_type.value],
            "confidence": int(item.confidence or 0),
            "external_references": [{"source_name": "ThreatLens", "external_id": str(item.id)}],
        })
    bundle = {"type": "bundle", "id": f"bundle--{datetime.utcnow().timestamp():.6f}", "objects": objects}
    return Response(
        content=json.dumps(bundle),
        media_type="application/stix+json",
        headers={"Content-Disposition": "attachment; filename=threatlens-indicators.stix.json"},
    )
