from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.models.user import User
from backend.app.schemas.auth import LoginRequest, LoginResponse, RefreshRequest, UserCreate, UserUpdate
from backend.app.services.auth_service import authenticate, create_refresh_token, create_token, decode_token, hash_password

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/login", response_model=LoginResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate(db, data.username, data.password)
    return LoginResponse(
        access_token=create_token(user),
        refresh_token=create_refresh_token(user),
        role=user.role,
        username=user.username,
    )


@router.post("/refresh", response_model=LoginResponse)
def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
    claims = decode_token(data.refresh_token, expected_type="refresh")
    if not claims:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    user = db.query(User).filter(User.username == claims.get("sub")).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return LoginResponse(
        access_token=create_token(user),
        refresh_token=create_refresh_token(user),
        role=user.role,
        username=user.username,
    )


@router.get("/users")
def list_users(db: Session = Depends(get_db)):
    return [
        {"id": user.id, "username": user.username, "role": user.role, "created_at": user.created_at.isoformat()}
        for user in db.query(User).order_by(User.username.asc()).all()
    ]


@router.post("/users", status_code=201)
def create_user(data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User.id).filter(User.username == data.username.strip()).first():
        raise HTTPException(status_code=409, detail="Username already exists")
    user = User(username=data.username.strip(), password_hash=hash_password(data.password), role=data.role.strip())
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "username": user.username, "role": user.role}


@router.put("/users/{user_id}")
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if data.role is not None:
        user.role = data.role.strip()
    if data.password is not None:
        user.password_hash = hash_password(data.password)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "username": user.username, "role": user.role}


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"deleted": True, "id": user_id}
