"""
ML Module — GoalFlow
- RandomForestClassifier: goal risk prediction
- IsolationForest: performance anomaly detection
- Models saved via joblib — NO retraining on restart
- Results cached 10 min — NO recomputation per request
"""
import os, time
import numpy as np
import joblib
import warnings
warnings.filterwarnings("ignore")
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.preprocessing import LabelEncoder
from typing import List, Dict

DIR      = os.path.dirname(os.path.abspath(__file__))
RF_PATH  = os.path.join(DIR, "saved_models", "risk_model.pkl")
LE_PATH  = os.path.join(DIR, "saved_models", "label_encoder.pkl")
CACHE_TTL = 600  # 10 minutes
_cache: Dict = {}

os.makedirs(os.path.join(DIR, "saved_models"), exist_ok=True)

def cache_get(key):
    e = _cache.get(key)
    return e["data"] if e and time.time() - e["ts"] < CACHE_TTL else None

def cache_set(key, data):
    _cache[key] = {"data": data, "ts": time.time()}
    return data

def invalidate():
    _cache.clear()

# ── Risk Predictor ─────────────────────────────────────────────────────────
class RiskPredictor:
    def __init__(self):
        if os.path.exists(RF_PATH) and os.path.exists(LE_PATH):
            self.model = joblib.load(RF_PATH)
            self.le    = joblib.load(LE_PATH)
            print("✅ ML: Risk model loaded from disk")
        else:
            self._train()

    def _train(self):
        np.random.seed(42)
        n = 300
        w   = np.random.choice([10,15,20,25,30,35,40], n)
        uom = np.random.choice(["numeric","percent","timeline","zero"], n)
        q   = np.random.choice([1,2,3,4], n)
        s   = np.random.uniform(0, 150, n)
        d   = np.random.randint(0, 90, n)
        lbl = (((s < 50) | (d > 30)) & (w >= 20)).astype(int)

        self.le    = LabelEncoder()
        uom_enc    = self.le.fit_transform(uom)
        X          = np.column_stack([w, uom_enc, q, s, d])
        self.model = RandomForestClassifier(n_estimators=50, random_state=42)
        self.model.fit(X, lbl)
        joblib.dump(self.model, RF_PATH)
        joblib.dump(self.le,    LE_PATH)
        print("✅ ML: Model trained & saved — will load from disk on next start")

    def predict(self, goal: dict, score: float, days: int, quarter: int) -> dict:
        uom = goal.get("uom", "numeric")
        w   = float(goal.get("weightage", 20))
        try:
            uom_enc = self.le.transform([uom])[0]
        except:
            uom_enc = 0
        prob  = float(self.model.predict_proba(np.array([[w, uom_enc, quarter, score, days]]))[0][1])
        label = "high" if prob > 0.6 else "medium" if prob > 0.35 else "low"
        drivers = []
        if score < 50:  drivers.append("Low current achievement score")
        if days  > 30:  drivers.append(f"No update in {days} days")
        if w    >= 30:  drivers.append(f"High-impact goal ({w}% weightage)")
        rec = {
            "high":   f"Immediate action needed for '{goal.get('title','')}'. Schedule 1:1 with manager.",
            "medium": f"Monitor '{goal.get('title','')}' closely. Log next check-in on time.",
            "low":    f"'{goal.get('title','')}' is on track. Maintain current pace.",
        }[label]
        return {"risk_score": round(prob*100,1), "risk_label": label, "drivers": drivers, "recommendation": rec}


# ── Anomaly Detector ───────────────────────────────────────────────────────
class AnomalyDetector:
    def detect(self, emp_scores: List[dict]) -> List[dict]:
        key    = f"anomalies_{len(emp_scores)}"
        cached = cache_get(key)
        if cached is not None:
            return cached
        if len(emp_scores) < 3:
            return cache_set(key, [])
        X     = np.array([[e.get("q1",0),e.get("q2",0),e.get("q3",0),e.get("q4",0)] for e in emp_scores], dtype=float)
        preds = IsolationForest(contamination=0.15, random_state=42).fit_predict(X)
        out   = []
        for i, p in enumerate(preds):
            if p == -1:
                sc  = X[i]
                nz  = [s for s in sc if s > 0]
                avg = float(np.mean(nz)) if nz else 0.0
                if avg < 40:           reason = "Consistently low performance"
                elif len(nz) <= 1:     reason = "Minimal check-in activity detected"
                elif max(sc)-min(nz or [0]) > 50: reason = "High variance across quarters"
                else:                  reason = "Unusual pattern compared to peers"
                out.append({"employee_id": emp_scores[i]["employee_id"],
                             "employee_name": emp_scores[i].get("employee_name",""),
                             "reason": reason, "avg_score": round(avg,1),
                             "scores": {"Q1":round(sc[0],1),"Q2":round(sc[1],1),"Q3":round(sc[2],1),"Q4":round(sc[3],1)}})
        return cache_set(key, out)


# ── Goal Recommendations ───────────────────────────────────────────────────
TEMPLATES = {
    "Engineering": [
        {"thrust_area":"Innovation & Technology","title":"Deploy ML Pipeline","uom":"timeline","suggested_target":"2026-09-30","uom_direction":"timeline","why":"Drives technical innovation KPI"},
        {"thrust_area":"Quality","title":"Code Coverage > 80%","uom":"percent","suggested_target":80,"uom_direction":"min","why":"Industry standard quality gate"},
    ],
    "Sales": [
        {"thrust_area":"Revenue Growth","title":"Monthly Recurring Revenue","uom":"numeric","suggested_target":1000000,"uom_direction":"min","why":"Primary sales KPI"},
        {"thrust_area":"Customer Success","title":"Net Promoter Score","uom":"numeric","suggested_target":50,"uom_direction":"min","why":"Tracks customer loyalty"},
    ],
    "Marketing": [
        {"thrust_area":"Market Expansion","title":"Lead Generation","uom":"numeric","suggested_target":500,"uom_direction":"min","why":"Core marketing KPI"},
    ],
    "HR": [
        {"thrust_area":"People & Culture","title":"Employee Retention Rate","uom":"percent","suggested_target":90,"uom_direction":"min","why":"Critical HR health metric"},
    ],
}

def recommend(department: str, existing: list) -> list:
    existing_titles = {g.get("title","").lower() for g in existing}
    return [s for s in TEMPLATES.get(department, TEMPLATES["Engineering"]) if s["title"].lower() not in existing_titles]


# Singletons — loaded once at startup
risk_predictor   = RiskPredictor()
anomaly_detector = AnomalyDetector()
