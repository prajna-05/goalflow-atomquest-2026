# GoalFlow — AtomQuest Hackathon 2026
### In-House Goal Setting & Tracking Portal
**Python FastAPI + SQLite + scikit-learn ML + React 18**

---

## 🔗 Live Links
| | URL |
|---|---|
| **🌐 Live App** | https://goalflow-backend-oqio.onrender.com |
| **📖 API Docs** | https://goalflow-backend-oqio.onrender.com/api/docs |
| **❤️ Health**  | https://goalflow-backend-oqio.onrender.com/api/health |
| **📁 GitHub**  | https://github.com/prajna-05/goalflow-atomquest-2026 |

> ⚠️ **Note:** Render free tier sleeps after inactivity.
> First load may take **60 seconds**. Please wait — it will load.

---

## 🔑 Demo Credentials
| Role     | Email                         | Password     |
|----------|-------------------------------|--------------|
| Employee | employee@atomberg.com         | password123  |
| Manager  | manager@atomberg.com          | password123  |
| Admin    | admin@atomberg.com            | password123  |

---

## 🏗️ Architecture
```
Single Render URL
       ↓
FastAPI (Python)
├── /api/auth    → JWT login
├── /api/goals   → Goal lifecycle
├── /api/admin   → Analytics, ML, Export
└── /            → Serves React build (static files)

SQLite (goalflow.db) ← SQLAlchemy ORM
ML (scikit-learn)    ← joblib saved models
```

---

## ⚡ Local Development

### Terminal 1 — Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Terminal 2 — Frontend
```bash
cd frontend
npm install
npm start
```

Frontend: http://localhost:3000
Backend:  http://localhost:8000

---

## ✅ Features
| Feature | Status |
|---|---|
| Goal creation (max 8, 100% weightage) | ✅ |
| 4 UoM types with auto score formulas | ✅ |
| Manager approve / return for rework | ✅ |
| Goals locked after approval | ✅ |
| Shared goals push to multiple employees | ✅ |
| Quarterly check-ins Q1–Q4 | ✅ |
| Excel export (Planned vs Actual) | ✅ |
| Full audit trail in SQLite | ✅ |
| Escalation engine | ✅ Bonus |
| Analytics dashboard | ✅ Bonus |
| ML Risk Prediction (RandomForest) | ✅ Bonus |
| ML Anomaly Detection (IsolationForest) | ✅ Bonus |

---

## 💰 Cost — $0 Total
- SQLite — no DB hosting needed
- Render free tier — backend + frontend together
- joblib — ML model saved, no retraining cost
- No paid APIs used
