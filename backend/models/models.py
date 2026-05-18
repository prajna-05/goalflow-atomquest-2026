"""
database/models.py
SQLAlchemy ORM models — maps Python classes to SQLite tables.
SQLite chosen: zero install, zero cost, file-based persistence,
built into Python standard library.
"""
from sqlalchemy import (
    create_engine, Column, String, Integer, Float,
    Boolean, ForeignKey, Text, DateTime
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH  = os.path.join(BASE_DIR, "goalflow.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine  = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base    = declarative_base()

# ── Dependency for FastAPI routes ─────────────────────────────────────────────
def get_db():
    db = Session()
    try:
        yield db
    finally:
        db.close()

# ── Tables ────────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"
    id         = Column(String, primary_key=True)
    name       = Column(String, nullable=False)
    email      = Column(String, unique=True, nullable=False)
    password   = Column(String, nullable=False)
    role       = Column(String, nullable=False)       # employee | manager | admin
    department = Column(String, nullable=False)
    manager_id = Column(String, ForeignKey("users.id"), nullable=True)
    avatar     = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    goal_sheets  = relationship("GoalSheet", back_populates="employee", foreign_keys="GoalSheet.employee_id")
    audit_logs   = relationship("AuditLog",  back_populates="performed_by_user")
    notifications= relationship("Notification", back_populates="user")


class GoalSheet(Base):
    __tablename__ = "goal_sheets"
    id                = Column(String, primary_key=True)
    employee_id       = Column(String, ForeignKey("users.id"), nullable=False)
    cycle_year        = Column(Integer, default=2026)
    status            = Column(String, default="draft")  # draft|pending_approval|approved|rework
    submitted_at      = Column(DateTime, nullable=True)
    approved_at       = Column(DateTime, nullable=True)
    approved_by       = Column(String, nullable=True)
    rejection_comment = Column(Text, nullable=True)
    unlocked_at       = Column(DateTime, nullable=True)
    created_at        = Column(DateTime, default=datetime.utcnow)
    updated_at        = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee        = relationship("User", back_populates="goal_sheets", foreign_keys=[employee_id])
    goals           = relationship("Goal", back_populates="sheet", cascade="all, delete-orphan")
    manager_comments= relationship("ManagerComment", back_populates="sheet", cascade="all, delete-orphan")


class Goal(Base):
    __tablename__ = "goals"
    id            = Column(String, primary_key=True)
    sheet_id      = Column(String, ForeignKey("goal_sheets.id"), nullable=False)
    thrust_area   = Column(String, nullable=False)
    title         = Column(String, nullable=False)
    description   = Column(Text, default="")
    uom           = Column(String, default="numeric")         # numeric|percent|timeline|zero
    uom_direction = Column(String, default="min")             # min|max|timeline|zero
    target        = Column(String, nullable=False)            # stored as string to handle dates too
    weightage     = Column(Float, nullable=False)
    status        = Column(String, default="not_started")     # not_started|on_track|completed
    is_shared     = Column(Boolean, default=False)
    shared_by     = Column(String, nullable=True)
    created_at    = Column(DateTime, default=datetime.utcnow)

    sheet     = relationship("GoalSheet", back_populates="goals")
    check_ins = relationship("CheckIn", back_populates="goal", cascade="all, delete-orphan")


class CheckIn(Base):
    __tablename__ = "check_ins"
    id         = Column(String, primary_key=True)
    goal_id    = Column(String, ForeignKey("goals.id"), nullable=False)
    quarter    = Column(String, nullable=False)   # Q1|Q2|Q3|Q4
    actual     = Column(String, nullable=False)   # string to handle dates
    status     = Column(String, default="not_started")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    goal = relationship("Goal", back_populates="check_ins")


class ManagerComment(Base):
    __tablename__ = "manager_comments"
    id          = Column(String, primary_key=True)
    sheet_id    = Column(String, ForeignKey("goal_sheets.id"), nullable=False)
    quarter     = Column(String, nullable=False)
    comment     = Column(Text, nullable=False)
    manager_id  = Column(String, nullable=False)
    manager_name= Column(String, nullable=False)
    created_at  = Column(DateTime, default=datetime.utcnow)

    sheet = relationship("GoalSheet", back_populates="manager_comments")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id             = Column(String, primary_key=True)
    entity_type    = Column(String, nullable=False)
    entity_id      = Column(String, nullable=False)
    action         = Column(String, nullable=False)
    performed_by_id= Column(String, ForeignKey("users.id"), nullable=False)
    performed_at   = Column(DateTime, default=datetime.utcnow)
    details        = Column(Text, default="")

    performed_by_user = relationship("User", back_populates="audit_logs")


class Notification(Base):
    __tablename__ = "notifications"
    id         = Column(String, primary_key=True)
    user_id    = Column(String, ForeignKey("users.id"), nullable=False)
    message    = Column(Text, nullable=False)
    type       = Column(String, default="info")
    read       = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


def init_db():
    """Create all tables if they don't exist."""
    Base.metadata.create_all(bind=engine)
