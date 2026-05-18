# GoalFlow — AtomQuest Hackathon 2026
### In-House Goal Setting & Tracking Portal
**Python FastAPI + SQLite + scikit-learn ML + React 18**

---

## 🔗 Live Links
- **Frontend (Live):** https://goalflow-atomquest-2026.vercel.app
- **Backend API:** https://goalflow-backend-oqio.onrender.com
- **Swagger Docs:** https://goalflow-backend-oqio.onrender.com/docs
- **GitHub:** https://github.com/prajna-05/goalflow-atomquest-2026

---

## ⚠️ Important Note
Backend is on Render free tier — first load takes 60 seconds to wake up.
Open this first: https://goalflow-backend-oqio.onrender.com/api/health
Wait for {"status":"running"} — then open the frontend.

---

## 🔑 Demo Credentials
| Role     | Email                         | Password     |
|----------|-------------------------------|--------------|
| Employee | employee@atomberg.com         | password123  |
| Manager  | manager@atomberg.com          | password123  |
| Admin    | admin@atomberg.com            | password123  |



---

## ✅ Problem Statement Coverage
| Requirement                            | Status     |
|----------------------------------------|------------|
| Goal creation (max 8, 100% weightage)  | ✅ Done    |
| 4 UoM types with auto score formulas   | ✅ Done    |
| Manager approve / return for rework    | ✅ Done    |
| Goals locked after approval            | ✅ Done    |
| Admin unlock with reason               | ✅ Done    |
| Shared goals push to multiple employees| ✅ Done    |
| Quarterly check-ins Q1–Q4              | ✅ Done    |
| Manager check-in comments              | ✅ Done    |
| Excel export (Planned vs Actual)       | ✅ Done    |
| Full audit trail                       | ✅ Done    |
| Escalation engine                      | ✅ Bonus   |
| Analytics dashboard                    | ✅ Bonus   |
| ML risk prediction (RandomForest)      | ✅ Bonus   |
| ML anomaly detection (IsolationForest) | ✅ Bonus   |

---

## 🏗️ Architecture
```
backend/
├── main.py           ← FastAPI app + auto DB seed on startup
├── seed.py           ← Demo data for SQLite
├── requirements.txt
├── models/
│   └── models.py     ← SQLAlchemy ORM (User, GoalSheet, Goal, CheckIn, etc.)
├── routes/
│   ├── auth.py       ← JWT login/me
│   ├── goals.py      ← Full goal lifecycle
│   └── admin.py      ← Analytics, ML, export, escalations
├── utils/
│   └── scoring.py    ← 4 score formulas
└── ml/
    ├── predictor.py  ← RandomForest + IsolationForest + caching
    └── saved_models/ ← joblib .pkl files (auto-created)

frontend/
└── src/
    ├── pages/        ← 9 pages (Login, Employee, Manager, Admin, etc.)
    ├── components/   ← Layout/sidebar
    ├── context/      ← AuthContext (JWT state)
    └── utils/        ← api.js (axios) + scoring.js
```

## 💰 Cost Optimisation
- **SQLite**: zero DB hosting cost, built into Python
- **joblib**: ML model saved to disk, no retraining on restart
- **10-min cache**: ML results cached, not recomputed per request
- **Free hosting**: Vercel (frontend) + Render (backend) = $0
