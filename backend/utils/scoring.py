from datetime import datetime
from typing import List

def compute_score(uom: str, direction: str, target: str, actual: str) -> float:
    if not actual:
        return 0.0
    if uom == "zero":
        return 100.0 if float(actual) == 0 else 0.0
    if uom == "timeline":
        try:
            td = datetime.strptime(target, "%Y-%m-%d")
            ad = datetime.strptime(actual, "%Y-%m-%d")
            if ad <= td: return 100.0
            return max(0.0, round(100.0 - (ad - td).days * 5, 2))
        except:
            return 0.0
    try:
        a, t = float(actual), float(target)
        if t == 0: return 0.0
        if direction == "min":
            return min(150.0, round((a / t) * 100, 2))
        else:
            if a == 0: return 150.0
            return min(150.0, round((t / a) * 100, 2))
    except:
        return 0.0

def compute_overall_score(goals) -> float:
    total = 0.0
    for goal in goals:
        if not goal.check_ins:
            continue
        latest = sorted(goal.check_ins, key=lambda c: c.updated_at)[-1]
        score  = compute_score(goal.uom, goal.uom_direction, goal.target, latest.actual)
        total += score * (goal.weightage / 100)
    return round(total, 2)

def validate_goals(goals: List[dict]) -> List[str]:
    errors = []
    if not goals:
        errors.append("At least one goal is required")
        return errors
    if len(goals) > 8:
        errors.append("Maximum 8 goals allowed")
    total_w = sum(float(g.get("weightage", 0)) for g in goals)
    if round(total_w) != 100:
        errors.append(f"Total weightage must be 100% (currently {round(total_w,1)}%)")
    for i, g in enumerate(goals):
        if float(g.get("weightage", 0)) < 10:
            errors.append(f"Goal {i+1}: Minimum weightage is 10%")
        if not g.get("thrust_area"):
            errors.append(f"Goal {i+1}: Thrust area is required")
        if not g.get("title"):
            errors.append(f"Goal {i+1}: Title is required")
        if not g.get("uom"):
            errors.append(f"Goal {i+1}: Unit of measurement is required")
        if not str(g.get("target", "")):
            errors.append(f"Goal {i+1}: Target is required")
    return errors
