from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models.models import init_db
from routes import auth, goals, admin
import sys, os

app = FastAPI(title="GoalFlow API", version="2.0.0",
              description="Atomberg AtomQuest 2026 — SQLite + ML Edition")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router,  prefix="/api/auth",  tags=["Auth"])
app.include_router(goals.router, prefix="/api/goals", tags=["Goals"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin & ML"])

@app.on_event("startup")
def startup():
    init_db()
    # Force clear and reseed every time (fixes password hash mismatch)
    from models.models import Session
    from models.models import User as UserModel
    db = Session()
    try:
        db.query(UserModel).delete()
        db.commit()
        print("🔄 Cleared users — reseeding...")
    except:
        db.rollback()
    finally:
        db.close()
    
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from seed import seed
    seed()
    print("🚀 GoalFlow API ready at http://localhost:8000")
    print("📖 Swagger docs at http://localhost:8000/docs")
    
@app.get("/api/health")
def health():
    return {"status": "running", "version": "2.0.0", "db": "SQLite"}
