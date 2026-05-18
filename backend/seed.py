"""
seed.py — Populates SQLite with demo users and one sample goal sheet.
Run once: python seed.py
Safe to re-run — skips if data already exists.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models.models import init_db, Session, User, GoalSheet, Goal, CheckIn, AuditLog
import hashlib
from datetime import datetime
import uuid

def pwd_hash(p): return hashlib.sha256(p.encode()).hexdigest()

USERS = [
    {"id":"u1","name":"Prajna J",     "email":"employee@atomberg.com", "password":"password123","role":"employee","department":"Engineering","manager_id":"u2","avatar":"PJ"},
    {"id":"u2","name":"Rahul Sharma", "email":"manager@atomberg.com",  "password":"password123","role":"manager", "department":"Engineering","manager_id":"u3","avatar":"RS"},
    {"id":"u3","name":"Anita Desai",  "email":"admin@atomberg.com",    "password":"password123","role":"admin",   "department":"HR",         "manager_id":None,"avatar":"AD"},
    {"id":"u4","name":"Vikram Patel", "email":"employee2@atomberg.com","password":"password123","role":"employee","department":"Sales",       "manager_id":"u2","avatar":"VP"},
    {"id":"u5","name":"Sneha Rao",    "email":"employee3@atomberg.com","password":"password123","role":"employee","department":"Engineering","manager_id":"u2","avatar":"SR"},
    {"id":"u6","name":"Arjun Mehta",  "email":"employee4@atomberg.com","password":"password123","role":"employee","department":"Marketing",  "manager_id":"u2","avatar":"AM"},
]

def seed():
    init_db()
    db = Session()

    # Skip if already seeded
    if db.query(User).first():
        print("✅ DB already seeded — skipping")
        db.close()
        return

    # Users
    for u in USERS:
       db.add(User(**{**u, "password": pwd_hash(u["password"])}))
    db.flush()

    # Sample approved goal sheet for Vikram (u4)
    sheet = GoalSheet(
        id="gs1", employee_id="u4", cycle_year=2026, status="approved",
        submitted_at=datetime(2026,5,1,10,0), approved_at=datetime(2026,5,3,14,0), approved_by="u2"
    )
    db.add(sheet)
    db.flush()

    goals_data = [
        ("g1","Revenue Growth","Achieve Sales Target","Achieve quarterly sales target of 50L","numeric","min","5000000",40),
        ("g2","Customer Success","CSAT Score","Maintain CSAT above 85%","percent","min","85",30),
        ("g3","Operational Efficiency","Reduce TAT","Reduce turnaround to under 2 days","numeric","max","2",20),
        ("g4","Safety","Zero Safety Incidents","Zero incidents throughout the year","zero","zero","0",10),
    ]
    checkin_data = {
        "g1":[("Q1","1200000","on_track")],
        "g2":[("Q1","88","on_track")],
        "g3":[("Q1","1.8","completed")],
        "g4":[("Q1","0","on_track")],
    }
    for gid, ta, title, desc, uom, direction, target, weight in goals_data:
        g = Goal(id=gid, sheet_id="gs1", thrust_area=ta, title=title, description=desc,
                 uom=uom, uom_direction=direction, target=target, weightage=weight)
        db.add(g)
        db.flush()
        for q, actual, status in checkin_data.get(gid, []):
            db.add(CheckIn(id=str(uuid.uuid4()), goal_id=gid, quarter=q, actual=actual, status=status))

    # Sample pending sheet for Sneha (u5)
    sheet2 = GoalSheet(id="gs2", employee_id="u5", cycle_year=2026,
                       status="pending_approval", submitted_at=datetime(2026,5,10,9,0))
    db.add(sheet2)
    db.flush()
    for gid, ta, title, uom, direction, target, weight in [
        (str(uuid.uuid4()),"Innovation & Technology","Deploy ML Pipeline","timeline","timeline","2026-09-30",50),
        (str(uuid.uuid4()),"Quality","Code Coverage > 80%","percent","min","90",30),
        (str(uuid.uuid4()),"People & Culture","Knowledge Sessions","numeric","min","4",20),
    ]:
        db.add(Goal(id=gid, sheet_id="gs2", thrust_area=ta, title=title,
                    uom=uom, uom_direction=direction, target=target, weightage=weight))

    db.add(AuditLog(id=str(uuid.uuid4()), entity_type="goalSheet", entity_id="gs1",
                    action="approved", performed_by_id="u2", details="Goal sheet approved by manager"))
    db.commit()
    db.close()
    print("✅ Database seeded successfully")

if __name__ == "__main__":
    seed()
