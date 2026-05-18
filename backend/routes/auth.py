from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from datetime import datetime, timedelta
from pydantic import BaseModel
from models.models import get_db, User
import hashlib

router  = APIRouter()
bearer  = HTTPBearer()
SECRET  = "goalflow-atomquest-2026-secret"
ALGO    = "HS256"

def hash_pw(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_pw(password: str, hashed: str) -> bool:
    return hash_pw(password) == hashed

class LoginReq(BaseModel):
    email: str
    password: str

def make_token(user: User) -> str:
    return jwt.encode({
        "id": user.id, "name": user.name, "email": user.email,
        "role": user.role, "department": user.department, "avatar": user.avatar,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }, SECRET, algorithm=ALGO)

def current_user(cred: HTTPAuthorizationCredentials = Depends(bearer)):
    try:
        return jwt.decode(cred.credentials, SECRET, algorithms=[ALGO])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_roles(*roles):
    def dep(user=Depends(current_user)):
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Access denied")
        return user
    return dep

@router.post("/login")
def login(req: LoginReq, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_pw(req.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"token": make_token(user),
            "user": {"id":user.id,"name":user.name,"email":user.email,
                     "role":user.role,"department":user.department,"avatar":user.avatar}}

@router.get("/me")
def me(user=Depends(current_user), db: Session = Depends(get_db)):
    u = db.query(User).filter(User.id == user["id"]).first()
    if not u: raise HTTPException(status_code=404, detail="Not found")
    return {"id":u.id,"name":u.name,"email":u.email,
            "role":u.role,"department":u.department,"avatar":u.avatar}