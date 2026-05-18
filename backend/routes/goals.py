from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
import uuid
from models.models import get_db, GoalSheet, Goal, CheckIn, ManagerComment, AuditLog, Notification, User
from utils.scoring import compute_score, compute_overall_score, validate_goals
from routes.auth import current_user, require_roles
from ml.predictor import invalidate

router = APIRouter()

THRUST_AREAS = [
    "Revenue Growth","Customer Success","Operational Efficiency",
    "Innovation & Technology","People & Culture","Safety",
    "Quality","Cost Reduction","Market Expansion","Sustainability"
]

def log(db, entity_type, entity_id, action, by_id, details=""):
    db.add(AuditLog(id=str(uuid.uuid4()), entity_type=entity_type, entity_id=entity_id,
                    action=action, performed_by_id=by_id, details=details))

def notify(db, user_id, message, ntype="info"):
    db.add(Notification(id=str(uuid.uuid4()), user_id=user_id, message=message, type=ntype))

def sheet_dict(sheet: GoalSheet, db: Session) -> dict:
    emp = db.query(User).filter(User.id == sheet.employee_id).first()
    return {
        "id": sheet.id, "employee_id": sheet.employee_id,
        "employee_name": emp.name if emp else "",
        "department": emp.department if emp else "",
        "cycle_year": sheet.cycle_year, "status": sheet.status,
        "submitted_at": sheet.submitted_at.isoformat() if sheet.submitted_at else None,
        "approved_at":  sheet.approved_at.isoformat()  if sheet.approved_at  else None,
        "rejection_comment": sheet.rejection_comment,
        "overall_score": compute_overall_score(sheet.goals),
        "manager_comments": [
            {"id":c.id,"quarter":c.quarter,"comment":c.comment,
             "manager_name":c.manager_name,"created_at":c.created_at.isoformat()}
            for c in sheet.manager_comments
        ],
        "goals": [goal_dict(g) for g in sheet.goals],
    }

def goal_dict(g: Goal) -> dict:
    return {
        "id": g.id, "thrust_area": g.thrust_area, "title": g.title,
        "description": g.description, "uom": g.uom, "uom_direction": g.uom_direction,
        "target": g.target, "weightage": g.weightage, "status": g.status,
        "is_shared": g.is_shared,
        "check_ins": [
            {"quarter":c.quarter,"actual":c.actual,"status":c.status,
             "updated_at":c.updated_at.isoformat() if c.updated_at else None}
            for c in sorted(g.check_ins, key=lambda x: x.quarter)
        ],
    }

def load_sheet(db, sheet_id):
    return db.query(GoalSheet).options(
        joinedload(GoalSheet.goals).joinedload(Goal.check_ins),
        joinedload(GoalSheet.manager_comments)
    ).filter(GoalSheet.id == sheet_id).first()

# ── Thrust areas ───────────────────────────────────────────────────────────
@router.get("/thrust-areas")
def get_thrust_areas(user=Depends(current_user)):
    return THRUST_AREAS

# ── My sheet ───────────────────────────────────────────────────────────────
@router.get("/my")
def my_sheet(user=Depends(current_user), db: Session = Depends(get_db)):
    sheet = db.query(GoalSheet).options(
        joinedload(GoalSheet.goals).joinedload(Goal.check_ins),
        joinedload(GoalSheet.manager_comments)
    ).filter(GoalSheet.employee_id == user["id"], GoalSheet.cycle_year == 2026).first()
    return sheet_dict(sheet, db) if sheet else None

# ── Save goals ─────────────────────────────────────────────────────────────
@router.post("/")
def save_goals(body: dict, user=Depends(require_roles("employee")), db: Session = Depends(get_db)):
    goals = body.get("goals", [])
    errors = validate_goals(goals)
    if errors:
        raise HTTPException(status_code=400, detail={"errors": errors})

    sheet = db.query(GoalSheet).filter(
        GoalSheet.employee_id == user["id"], GoalSheet.cycle_year == 2026
    ).first()

    if sheet and sheet.status == "approved":
        raise HTTPException(status_code=400, detail={"errors": ["Goals are locked. Contact Admin to unlock."]})

    if not sheet:
        sheet = GoalSheet(id=str(uuid.uuid4()), employee_id=user["id"], cycle_year=2026, status="draft")
        db.add(sheet)
        db.flush()

    # Delete old goals and recreate (simple & reliable)
    for old_goal in sheet.goals:
        db.delete(old_goal)
    db.flush()

    for g in goals:
        new_goal = Goal(
            id=g.get("id") or str(uuid.uuid4()), sheet_id=sheet.id,
            thrust_area=g["thrust_area"], title=g["title"],
            description=g.get("description",""), uom=g["uom"],
            uom_direction=g["uom_direction"], target=str(g["target"]),
            weightage=float(g["weightage"]), is_shared=g.get("is_shared", False)
        )
        db.add(new_goal)

    sheet.status = "draft"
    sheet.updated_at = datetime.utcnow()
    log(db, "goalSheet", sheet.id, "updated", user["id"], "Goals saved")
    db.commit()
    return sheet_dict(load_sheet(db, sheet.id), db)

# ── Submit ─────────────────────────────────────────────────────────────────
@router.post("/{sheet_id}/submit")
def submit(sheet_id: str, user=Depends(require_roles("employee")), db: Session = Depends(get_db)):
    sheet = load_sheet(db, sheet_id)
    if not sheet or sheet.employee_id != user["id"]:
        raise HTTPException(status_code=404, detail="Not found")
    errors = validate_goals([goal_dict(g) for g in sheet.goals])
    if errors:
        raise HTTPException(status_code=400, detail={"errors": errors})
    sheet.status = "pending_approval"
    sheet.submitted_at = datetime.utcnow()
    log(db, "goalSheet", sheet_id, "submitted", user["id"], "Submitted for approval")
    emp = db.query(User).filter(User.id == user["id"]).first()
    mgr_id = emp.manager_id if emp else None
    if mgr_id:
        notify(db, mgr_id, f"{user['name']} submitted goals for your approval", "goal_submitted")
    db.commit()
    return sheet_dict(load_sheet(db, sheet_id), db)

# ── Team sheets ────────────────────────────────────────────────────────────
@router.get("/team")
def team_sheets(user=Depends(require_roles("manager","admin")), db: Session = Depends(get_db)):
    if user["role"] == "admin":
        emp_ids = [u.id for u in db.query(User).filter(User.role == "employee").all()]
    else:
        emp_ids = [u.id for u in db.query(User).filter(User.manager_id == user["id"]).all()]
    sheets = db.query(GoalSheet).options(
        joinedload(GoalSheet.goals).joinedload(Goal.check_ins),
        joinedload(GoalSheet.manager_comments)
    ).filter(GoalSheet.employee_id.in_(emp_ids), GoalSheet.cycle_year == 2026).all()
    return [sheet_dict(s, db) for s in sheets]

# ── Get one ────────────────────────────────────────────────────────────────
@router.get("/{sheet_id}")
def get_sheet(sheet_id: str, user=Depends(current_user), db: Session = Depends(get_db)):
    sheet = load_sheet(db, sheet_id)
    if not sheet: raise HTTPException(status_code=404, detail="Not found")
    return sheet_dict(sheet, db)

# ── Approve ────────────────────────────────────────────────────────────────
@router.post("/{sheet_id}/approve")
def approve(sheet_id: str, body: dict = {}, user=Depends(require_roles("manager","admin")), db: Session = Depends(get_db)):
    sheet = load_sheet(db, sheet_id)
    if not sheet: raise HTTPException(status_code=404, detail="Not found")
    if body.get("goals"):
        errors = validate_goals(body["goals"])
        if errors: raise HTTPException(status_code=400, detail={"errors": errors})
        for old in sheet.goals: db.delete(old)
        db.flush()
        for g in body["goals"]:
            db.add(Goal(id=g.get("id") or str(uuid.uuid4()), sheet_id=sheet.id,
                        thrust_area=g["thrust_area"], title=g["title"],
                        description=g.get("description",""), uom=g["uom"],
                        uom_direction=g["uom_direction"], target=str(g["target"]),
                        weightage=float(g["weightage"])))
    sheet.status = "approved"
    sheet.approved_at = datetime.utcnow()
    sheet.approved_by = user["id"]
    log(db, "goalSheet", sheet_id, "approved", user["id"], "Approved and locked")
    notify(db, sheet.employee_id, "Your goals have been approved and locked!", "goal_approved")
    db.commit()
    return sheet_dict(load_sheet(db, sheet_id), db)

# ── Reject ─────────────────────────────────────────────────────────────────
@router.post("/{sheet_id}/reject")
def reject(sheet_id: str, body: dict, user=Depends(require_roles("manager","admin")), db: Session = Depends(get_db)):
    sheet = load_sheet(db, sheet_id)
    if not sheet: raise HTTPException(status_code=404, detail="Not found")
    sheet.status = "rework"
    sheet.rejection_comment = body.get("comment","")
    log(db, "goalSheet", sheet_id, "returned_for_rework", user["id"], body.get("comment",""))
    notify(db, sheet.employee_id, f"Goals need revision: {body.get('comment','Please review')}", "goal_rejected")
    db.commit()
    return sheet_dict(load_sheet(db, sheet_id), db)

# ── Unlock (admin) ─────────────────────────────────────────────────────────
@router.post("/{sheet_id}/unlock")
def unlock(sheet_id: str, body: dict = {}, user=Depends(require_roles("admin")), db: Session = Depends(get_db)):
    sheet = load_sheet(db, sheet_id)
    if not sheet: raise HTTPException(status_code=404, detail="Not found")
    sheet.status = "draft"
    sheet.unlocked_at = datetime.utcnow()
    log(db, "goalSheet", sheet_id, "unlocked", user["id"], body.get("reason","Unlocked by admin"))
    db.commit()
    return sheet_dict(load_sheet(db, sheet_id), db)

# ── Check-in ───────────────────────────────────────────────────────────────
@router.post("/{sheet_id}/checkin")
def checkin(sheet_id: str, body: dict, user=Depends(require_roles("employee")), db: Session = Depends(get_db)):
    sheet = load_sheet(db, sheet_id)
    if not sheet or sheet.employee_id != user["id"]:
        raise HTTPException(status_code=404, detail="Not found")
    if sheet.status != "approved":
        raise HTTPException(status_code=400, detail="Goals must be approved first")
    goal = next((g for g in sheet.goals if g.id == body["goal_id"]), None)
    if not goal: raise HTTPException(status_code=404, detail="Goal not found")

    existing = next((c for c in goal.check_ins if c.quarter == body["quarter"]), None)
    if existing:
        existing.actual = str(body["actual"])
        existing.status = body["status"]
        existing.updated_at = datetime.utcnow()
    else:
        db.add(CheckIn(id=str(uuid.uuid4()), goal_id=goal.id,
                       quarter=body["quarter"], actual=str(body["actual"]), status=body["status"]))
    goal.status = body["status"]
    log(db, "goal", goal.id, "checkin_updated", user["id"], f"{body['quarter']} check-in updated")
    invalidate()  # clear ML cache — fresh data available
    db.commit()
    return sheet_dict(load_sheet(db, sheet_id), db)

# ── Manager comment ────────────────────────────────────────────────────────
@router.post("/{sheet_id}/comment")
def add_comment(sheet_id: str, body: dict, user=Depends(require_roles("manager","admin")), db: Session = Depends(get_db)):
    sheet = load_sheet(db, sheet_id)
    if not sheet: raise HTTPException(status_code=404, detail="Not found")
    db.add(ManagerComment(id=str(uuid.uuid4()), sheet_id=sheet_id,
                          quarter=body["quarter"], comment=body["comment"],
                          manager_id=user["id"], manager_name=user["name"]))
    log(db, "goalSheet", sheet_id, "comment_added", user["id"], f"{body['quarter']} comment added")
    db.commit()
    return sheet_dict(load_sheet(db, sheet_id), db)

# ── Push shared goal ───────────────────────────────────────────────────────
@router.post("/shared/push")
def push_shared(body: dict, user=Depends(require_roles("admin","manager")), db: Session = Depends(get_db)):
    pushed = []
    for emp_id in body.get("employee_ids", []):
        sheet = db.query(GoalSheet).filter(
            GoalSheet.employee_id == emp_id, GoalSheet.cycle_year == 2026
        ).first()
        if not sheet:
            sheet = GoalSheet(id=str(uuid.uuid4()), employee_id=emp_id, cycle_year=2026, status="draft")
            db.add(sheet); db.flush()
        if sheet.status == "approved":
            continue
        g = body["goal"]
        db.add(Goal(id=str(uuid.uuid4()), sheet_id=sheet.id,
                    thrust_area=g["thrust_area"], title=g["title"],
                    description=g.get("description",""), uom=g["uom"],
                    uom_direction=g["uom_direction"], target=str(g["target"]),
                    weightage=float(g["weightage"]), is_shared=True, shared_by=user["id"]))
        pushed.append(emp_id)
    db.commit()
    return {"pushed": pushed}
