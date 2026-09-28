from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.models.saved_hunt import SavedHunt
from backend.app.models.user import User
from backend.app.schemas.saved_hunt import SavedHuntCreate, SavedHuntResponse

router = APIRouter(prefix="/api/v1/hunts", tags=["Threat Hunting"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _user_id(request: Request, db: Session):
    claims = getattr(request.state, "user", None) or {}
    username = claims.get("sub")
    if username:
        user = db.query(User).filter(User.username == username).first()
        if user:
            return user.id
    return None


@router.get("/", response_model=list[SavedHuntResponse])
def list_hunts(request: Request, db: Session = Depends(get_db)):
    user_id = _user_id(request, db)
    return db.query(SavedHunt).filter(SavedHunt.user_id == user_id).order_by(SavedHunt.updated_at.desc()).all()


@router.post("/", response_model=SavedHuntResponse, status_code=201)
def create_hunt(data: SavedHuntCreate, request: Request, db: Session = Depends(get_db)):
    user_id = _user_id(request, db)
    hunt = SavedHunt(user_id=user_id, name=data.name.strip(), query=data.query.strip(), indicator_type=data.indicator_type)
    db.add(hunt)
    db.commit()
    db.refresh(hunt)
    return hunt


@router.delete("/{hunt_id}")
def delete_hunt(hunt_id: int, request: Request, db: Session = Depends(get_db)):
    user_id = _user_id(request, db)
    hunt = db.query(SavedHunt).filter(SavedHunt.id == hunt_id, SavedHunt.user_id == user_id).first()
    if hunt is None:
        raise HTTPException(status_code=404, detail="Saved hunt not found")
    db.delete(hunt)
    db.commit()
    return {"deleted": True, "id": hunt_id}
