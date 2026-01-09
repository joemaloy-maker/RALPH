"""
RALPH Database Models
=====================
SQLAlchemy models for the coaching platform.
"""

from datetime import datetime, date
from typing import Optional, List
from enum import Enum as PyEnum
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Boolean, 
    DateTime, Date, Text, ForeignKey, Enum, JSON
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy.sql import func

Base = declarative_base()


# ─────────────────────────────────────────────────────────────────────────────
# ENUMS
# ─────────────────────────────────────────────────────────────────────────────

class RecoveryStatus(str, PyEnum):
    GREEN = "green"
    YELLOW = "yellow"
    RED = "red"


class SessionType(str, PyEnum):
    REST = "rest"
    RECOVERY = "recovery"
    EASY = "easy"
    ENDURANCE = "endurance"
    TEMPO = "tempo"
    THRESHOLD = "threshold"
    VO2MAX = "vo2max"
    LONG = "long"
    RACE = "race"
    BRICK = "brick"
    STRENGTH = "strength"
    DRILL = "drill"


class SessionRole(str, PyEnum):
    KEY_LONG = "key_long"
    KEY_INTENSITY = "key_intensity"
    KEY_SECONDARY = "key_secondary"
    SUPPORT = "support"
    RECOVERY = "recovery"
    REST = "rest"


class ComplianceStatus(str, PyEnum):
    PENDING = "pending"
    NAILED = "nailed"
    COMPLETED = "completed"
    MODIFIED = "modified"
    PARTIAL = "partial"
    MISSED = "missed"
    SWAPPED = "swapped"
    EXCEEDED = "exceeded"


class TrainingPhase(str, PyEnum):
    BASE = "base"
    BUILD = "build"
    PEAK = "peak"
    TAPER = "taper"
    RECOVERY = "recovery"
    RACE = "race"


class Sport(str, PyEnum):
    RUN = "run"
    BIKE = "bike"
    SWIM = "swim"
    STRENGTH = "strength"
    OTHER = "other"


# ─────────────────────────────────────────────────────────────────────────────
# CORE MODELS
# ─────────────────────────────────────────────────────────────────────────────

class Coach(Base):
    """Coach/user who manages athletes."""
    __tablename__ = "coaches"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    athletes = relationship("Athlete", back_populates="coach")


class Athlete(Base):
    """Athlete being coached."""
    __tablename__ = "athletes"
    
    id = Column(Integer, primary_key=True, index=True)
    coach_id = Column(Integer, ForeignKey("coaches.id"), nullable=False)
    
    # Basic info
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True)
    avatar_initials = Column(String(10))  # e.g., "AC"
    
    # Goal race
    goal_race_name = Column(String(255))
    goal_race_date = Column(Date)
    goal_time_seconds = Column(Integer)  # Target finish time in seconds
    goal_type = Column(String(50))  # "time", "completion", "placement"
    
    # Current fitness benchmarks
    current_ftp = Column(Float)  # Watts
    current_threshold_pace = Column(Float)  # sec/mile
    current_run_ftp = Column(Float)  # Running power if available
    current_swim_css = Column(Float)  # Critical swim speed (sec/100m)
    
    # Target fitness
    target_ftp = Column(Float)
    target_threshold_pace = Column(Float)
    
    # Integration tokens (encrypted in production)
    garmin_oauth_token = Column(Text)
    garmin_oauth_secret = Column(Text)
    whoop_access_token = Column(Text)
    whoop_refresh_token = Column(Text)
    
    # Metadata
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    coach = relationship("Coach", back_populates="athletes")
    plans = relationship("TrainingPlan", back_populates="athlete")
    workouts = relationship("ExecutedWorkout", back_populates="athlete")
    daily_metrics = relationship("DailyMetrics", back_populates="athlete")


class TrainingPlan(Base):
    """A periodized training plan for an athlete."""
    __tablename__ = "training_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("athletes.id"), nullable=False)
    
    name = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Timing
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_weeks = Column(Integer)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Phase structure (stored as JSON for flexibility)
    # Format: [{"name": "Base", "weeks": 4, "type": "base"}, ...]
    phases = Column(JSON)
    
    # Progressions (JSON)
    # Format: [{"metric": "long_run", "start": 60, "end": 120, "unit": "min"}, ...]
    progressions = Column(JSON)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    athlete = relationship("Athlete", back_populates="plans")
    sessions = relationship("PlannedSession", back_populates="plan", cascade="all, delete-orphan")


class PlannedSession(Base):
    """A single prescribed workout within a plan."""
    __tablename__ = "planned_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("training_plans.id"), nullable=False)
    
    # Scheduling
    date = Column(Date, nullable=False, index=True)
    day_of_week = Column(Integer)  # 0=Monday, 6=Sunday
    week_number = Column(Integer)  # Week within the plan
    
    # Classification
    sport = Column(Enum(Sport), default=Sport.RUN)
    session_type = Column(Enum(SessionType), nullable=False)
    session_role = Column(Enum(SessionRole), default=SessionRole.SUPPORT)
    phase = Column(Enum(TrainingPhase))
    
    # Prescription
    title = Column(String(255), nullable=False)
    description = Column(Text)
    purpose = Column(Text)  # Why this session matters
    
    # Duration/Distance
    duration_minutes = Column(Integer)
    distance_meters = Column(Float)
    
    # Targets
    target_pace_low = Column(Float)  # sec/mile or sec/100m
    target_pace_high = Column(Float)
    target_power_low = Column(Integer)  # Watts
    target_power_high = Column(Integer)
    target_hr_low = Column(Integer)  # BPM
    target_hr_high = Column(Integer)
    target_rpe = Column(Integer)  # 1-10
    target_zone = Column(Integer)  # 1-6
    
    # Structure (JSON for complex workouts)
    # Format: {"warmup": "10min easy", "main": "4x8min @ threshold", "cooldown": "10min"}
    structure = Column(JSON)
    
    # Priority
    is_key_session = Column(Boolean, default=False)
    priority = Column(Integer, default=3)  # 1-5
    
    # Recovery modifications
    if_recovery_yellow = Column(String(500))
    if_recovery_red = Column(String(500))
    
    # Mundanity reframe
    elite_mindset = Column(Text)  # How elite athletes think about this
    
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    plan = relationship("TrainingPlan", back_populates="sessions")
    executed_workout = relationship("ExecutedWorkout", back_populates="planned_session", uselist=False)


class ExecutedWorkout(Base):
    """An actual workout that was performed."""
    __tablename__ = "executed_workouts"
    
    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("athletes.id"), nullable=False)
    planned_session_id = Column(Integer, ForeignKey("planned_sessions.id"))
    
    # Metadata
    workout_date = Column(Date, nullable=False, index=True)
    sport = Column(Enum(Sport))
    source = Column(String(50))  # "garmin", "whoop", "fit_upload", "manual"
    fit_file_path = Column(String(500))
    external_id = Column(String(255))  # ID from Garmin/WHOOP
    
    # Basic metrics
    duration_seconds = Column(Integer)
    distance_meters = Column(Float)
    
    # Pace/Speed
    avg_pace = Column(Float)  # sec/mile or sec/km
    max_pace = Column(Float)
    
    # Power
    avg_power = Column(Float)
    normalized_power = Column(Float)
    max_power = Column(Float)
    
    # Heart Rate
    avg_hr = Column(Integer)
    max_hr = Column(Integer)
    
    # Derived metrics
    tss = Column(Float)  # Training Stress Score
    intensity_factor = Column(Float)  # NP/FTP
    variability_index = Column(Float)  # NP/AP
    efficiency_factor = Column(Float)  # Power/HR or Pace/HR
    decoupling_pct = Column(Float)  # Aerobic decoupling
    
    # Zone distribution (JSON)
    # Format: {"z1": 10.5, "z2": 45.2, ...}
    zone_distribution = Column(JSON)
    
    # Classification
    workout_type = Column(String(50))  # Inferred type
    
    # Compliance
    compliance_status = Column(Enum(ComplianceStatus), default=ComplianceStatus.PENDING)
    compliance_notes = Column(Text)
    
    # Flags
    is_breakthrough = Column(Boolean, default=False)
    breakthrough_detail = Column(String(255))  # e.g., "FTP increase: 250→262W"
    
    # Goal contribution (0-1)
    goal_contribution = Column(Float)
    
    # Concerns flagged during analysis
    concerns = Column(JSON)  # List of concern strings
    
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    athlete = relationship("Athlete", back_populates="workouts")
    planned_session = relationship("PlannedSession", back_populates="executed_workout")


class DailyMetrics(Base):
    """Daily recovery and wellness metrics."""
    __tablename__ = "daily_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("athletes.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    
    # Source
    source = Column(String(50))  # "garmin", "whoop", "manual"
    
    # Body Battery / Recovery
    body_battery_min = Column(Integer)
    body_battery_max = Column(Integer)
    body_battery_avg = Column(Integer)
    recovery_score = Column(Integer)  # 0-100
    recovery_status = Column(Enum(RecoveryStatus))
    
    # Sleep
    sleep_hours = Column(Float)
    sleep_score = Column(Integer)  # WHOOP sleep score
    sleep_quality = Column(String(50))  # "poor", "fair", "good", "excellent"
    
    # Vitals
    resting_hr = Column(Integer)
    hrv = Column(Float)  # ms
    respiratory_rate = Column(Float)
    
    # Subjective (manual entry)
    energy_level = Column(Integer)  # 1-10
    muscle_soreness = Column(Integer)  # 1-10
    mood = Column(Integer)  # 1-10
    notes = Column(Text)
    
    # WHOOP strain
    strain_score = Column(Float)
    
    created_at = Column(DateTime, server_default=func.now())
    
    # Unique constraint on athlete + date
    __table_args__ = (
        # UniqueConstraint('athlete_id', 'date', name='unique_daily_metrics'),
    )
    
    # Relationships
    athlete = relationship("Athlete", back_populates="daily_metrics")


# ─────────────────────────────────────────────────────────────────────────────
# DATABASE SETUP
# ─────────────────────────────────────────────────────────────────────────────

def get_engine(database_url: str = "sqlite:///./ralph.db"):
    """Create database engine."""
    return create_engine(database_url, connect_args={"check_same_thread": False})


def get_session_maker(engine):
    """Create session maker."""
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db(database_url: str = "sqlite:///./ralph.db"):
    """Initialize the database, creating all tables."""
    engine = get_engine(database_url)
    Base.metadata.create_all(bind=engine)
    return engine


def get_db(engine):
    """Dependency for FastAPI to get DB session."""
    SessionLocal = get_session_maker(engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
