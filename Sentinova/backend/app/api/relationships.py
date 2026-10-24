from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.models.indicator import Indicator
from backend.app.models.relationship import IndicatorRelationship
from backend.app.schemas.relationship import IndicatorRelationshipCreate, IndicatorRelationshipResponse

router = APIRouter(prefix="/api/v1/indicators", tags=["Relationships"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _serialize(db: Session, row: IndicatorRelationship):
    source = db.query(Indicator).filter(Indicator.id == row.source_indicator_id).first()
    target = db.query(Indicator).filter(Indicator.id == row.target_indicator_id).first()
    return IndicatorRelationshipResponse(
        id=row.id,
        source_indicator_id=row.source_indicator_id,
        target_indicator_id=row.target_indicator_id,
        relationship_type=row.relationship_type,
        created_at=row.created_at,
        source_value=source.value if source else None,
        target_value=target.value if target else None,
        source_type=source.indicator_type.value if source else None,
        target_type=target.indicator_type.value if target else None,
    )


@router.get("/{indicator_id}/relationships", response_model=list[IndicatorRelationshipResponse])
def get_relationships(indicator_id: int, db: Session = Depends(get_db)):
    if db.query(Indicator.id).filter(Indicator.id == indicator_id).first() is None:
        raise HTTPException(status_code=404, detail="Indicator not found")
    rows = db.query(IndicatorRelationship).filter(
        or_(IndicatorRelationship.source_indicator_id == indicator_id, IndicatorRelationship.target_indicator_id == indicator_id)
    ).order_by(IndicatorRelationship.created_at.desc()).all()
    return [_serialize(db, row) for row in rows]


@router.post("/{indicator_id}/relationships", response_model=IndicatorRelationshipResponse, status_code=201)
def create_relationship(indicator_id: int, data: IndicatorRelationshipCreate, db: Session = Depends(get_db)):
    if indicator_id == data.target_indicator_id:
        raise HTTPException(status_code=400, detail="An indicator cannot relate to itself")
    for current_id in (indicator_id, data.target_indicator_id):
        if db.query(Indicator.id).filter(Indicator.id == current_id).first() is None:
            raise HTTPException(status_code=404, detail=f"Indicator {current_id} not found")
    relation = data.relationship_type.strip()
    existing = db.query(IndicatorRelationship).filter(
        IndicatorRelationship.source_indicator_id == indicator_id,
        IndicatorRelationship.target_indicator_id == data.target_indicator_id,
        IndicatorRelationship.relationship_type == relation,
    ).first()
    if existing:
        return _serialize(db, existing)
    record = IndicatorRelationship(
        source_indicator_id=indicator_id,
        target_indicator_id=data.target_indicator_id,
        relationship_type=relation,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _serialize(db, record)
