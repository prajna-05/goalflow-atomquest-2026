from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from models.models import init_db
from routes import auth, goals, admin
import sys, os

app = FastAPI(
    title="GoalFlow API",
    version="2.0.0",
    description="Atomberg AtomQuest 2026 — SQLite + ML Edition",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── API routes ─────────────────────────────────────────────────────────────
app.include_router(auth.router,  prefix="/api/auth",  tags=["Auth"])
app.include_router(goals.router, prefix="/api/goals", tags=["Goals"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin & ML"])

@app.get("/api/health")
def health():
    return {"status": "running", "version": "2.0.0", "db": "SQLite"}

# ── Startup ────────────────────────────────────────────────────────────────
@app.on_event("startup")
def startup():
    init_db()
    from models.models import Session, Base, engine
    from models.models import User as UserModel
    db = Session()
    try:
        user_count = db.query(UserModel).count()
        if user_count == 0:
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)
            print("🔄 Fresh database — seeding...")
            db.close()
            sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
            from seed import seed
            seed()
        else:
            print("✅ DB already has data — skipping reseed")
            db.close()
    except Exception as e:
        print(f"⚠️ Startup error: {e}")
        db.close()
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from seed import seed
        seed()
    print("🚀 GoalFlow ready!")

# ── Serve React static files ───────────────────────────────────────────────
# React build folder is at ../frontend/build relative to backend
BUILD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "build")

if os.path.exists(BUILD_DIR):
    # Serve static assets (JS, CSS, images)
    app.mount("/static", StaticFiles(directory=os.path.join(BUILD_DIR, "static")), name="static")

    # Serve React app for ALL non-API routes
    @app.get("/{full_path:path}")
    def serve_react(full_path: str):
        # If requesting an actual file that exists, serve it
        file_path = os.path.join(BUILD_DIR, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        # Otherwise serve index.html (React Router handles the rest)
        return FileResponse(os.path.join(BUILD_DIR, "index.html"))
else:
    print("⚠️ React build not found — API only mode")
    print(f"   Expected build at: {BUILD_DIR}")
