"""
RALPH API Schemas
=================
Pydantic models for request/response validation.
"""

from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from enum import Enum


# ─────────────────────────────────────────────────────────────────────────────
# ENUMS (mirror database enums)
# ─────────────────────────────────────────────────────────────────────────────

class RecoveryStatus(str, Enum):
    GREEN = "green"
    YELLOW = "yellow"
    RED = "red"


class SessionType(str, Enum):
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


class Sport(str, Enum):
    RUN = "run"
    BIKE = "bike"
    SWIM = "swim"
    STRENGTH = "strength"
    OTHER = "other"


class ComplianceStatus(str, Enum):
    PENDING = "pending"
    NAILED = "nailed"
    COMPLETED = "completed"
    MODIFIED = "modified"
    PARTIAL = "partial"
    MISSED = "missed"
    SWAPPED = "swapped"
    EXCEEDED = "exceeded"


class TrainingPhase(str, Enum):
    BASE = "base"
    BUILD = "build"
    PEAK = "peak"
    TAPER = "taper"
    RECOVERY = "recovery"
    RACE = "race"


# ─────────────────────────────────────────────────────────────────────────────
# ATHLETE SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────

class AthleteCreate(BaseModel):
    name: str
    email: EmailStr
    avatar_initials: Optional[str] = None
    
    # Goal
    goal_race_name: Optional[str] = None
    goal_race_date: Optional[date] = None
    goal_time_seconds: Optional[int] = None
    goal_type: Optional[str] = "time"
    
    # Current fitness
    current_ftp: Optional[float] = None
    current_threshold_pace: Optional[float] = None
    
    # Targets
    target_ftp: Optional[float] = None
    target_threshold_pace: Optional[float] = None


class AthleteUpdate(BaseModel):
    name: Optional[str] = None
    goal_race_name: Optional[str] = None
    goal_race_date: Optional[date] = None
    goal_time_seconds: Optional[int] = None
    current_ftp: Optional[float] = None
    current_threshold_pace: Optional[float] = None
    target_ftp: Optional[float] = None
    target_threshold_pace: Optional[float] = None


class AthleteResponse(BaseModel):
    id: int
    name: str
    email: str
    avatar_initials: Optional[str]
    goal_race_name: Optional[str]
    goal_race_date: Optional[date]
    goal_time_seconds: Optional[int]
    goal_type: Optional[str]
    current_ftp: Optional[float]
    current_threshold_pace: Optional[float]
    target_ftp: Optional[float]
    target_threshold_pace: Optional[float]
    created_at: datetime
    
    class Config:
        from_attributes = True


class AthleteListItem(BaseModel):
    """Lightweight athlete info for list views."""
    id: int
    name: str
    avatar_initials: Optional[str]
    goal_race_name: Optional[str]
    goal_race_date: Optional[date]
    days_to_race: Optional[int]
    current_phase: Optional[str]
    recovery_status: Optional[RecoveryStatus]
    compliance_rate: Optional[float]  # Last 7 days
    
    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────────────────────
# TRAINING PLAN SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────

class PhaseDefinition(BaseModel):
    name: str
    type: TrainingPhase
    weeks: int
    focus: Optional[str] = None


class ProgressionDefinition(BaseModel):
    metric: str
    start_value: float
    end_value: float
    unit: str
    weekly_increment: Optional[float] = None


class TrainingPlanCreate(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: date
    end_date: date
    phases: Optional[List[PhaseDefinition]] = None
    progressions: Optional[List[ProgressionDefinition]] = None


class TrainingPlanResponse(BaseModel):
    id: int
    athlete_id: int
    name: str
    description: Optional[str]
    start_date: date
    end_date: date
    total_weeks: Optional[int]
    is_active: bool
    phases: Optional[List[Dict[str, Any]]]
    progressions: Optional[List[Dict[str, Any]]]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────────────────────
# PLANNED SESSION SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────

class PlannedSessionCreate(BaseModel):
    date: date
    sport: Sport = Sport.RUN
    session_type: SessionType
    title: str
    description: Optional[str] = None
    purpose: Optional[str] = None
    
    duration_minutes: Optional[int] = None
    distance_meters: Optional[float] = None
    
    target_pace_low: Optional[float] = None
    target_pace_high: Optional[float] = None
    target_power_low: Optional[int] = None
    target_power_high: Optional[int] = None
    target_hr_low: Optional[int] = None
    target_hr_high: Optional[int] = None
    target_rpe: Optional[int] = None
    target_zone: Optional[int] = None
    
    structure: Optional[Dict[str, Any]] = None
    
    is_key_session: bool = False
    priority: int = 3
    
    if_recovery_yellow: Optional[str] = None
    if_recovery_red: Optional[str] = None
    elite_mindset: Optional[str] = None


class PlannedSessionResponse(BaseModel):
    id: int
    plan_id: int
    date: date
    day_of_week: Optional[int]
    week_number: Optional[int]
    sport: Sport
    session_type: SessionType
    title: str
    description: Optional[str]
    purpose: Optional[str]
    duration_minutes: Optional[int]
    distance_meters: Optional[float]
    target_pace_low: Optional[float]
    target_pace_high: Optional[float]
    target_power_low: Optional[int]
    target_power_high: Optional[int]
    is_key_session: bool
    priority: int
    if_recovery_yellow: Optional[str]
    if_recovery_red: Optional[str]
    elite_mindset: Optional[str]
    compliance_status: Optional[ComplianceStatus] = None
    
    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────────────────────
# WORKOUT SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────

class WorkoutUploadResponse(BaseModel):
    id: int
    workout_date: date
    sport: Optional[Sport]
    duration_seconds: Optional[int]
    distance_meters: Optional[float]
    avg_power: Optional[float]
    normalized_power: Optional[float]
    avg_hr: Optional[int]
    intensity_factor: Optional[float]
    variability_index: Optional[float]
    decoupling_pct: Optional[float]
    workout_type: Optional[str]
    is_breakthrough: bool
    breakthrough_detail: Optional[str]
    compliance_status: ComplianceStatus
    matched_session_title: Optional[str] = None
    concerns: Optional[List[str]]
    
    class Config:
        from_attributes = True


class WorkoutListItem(BaseModel):
    id: int
    workout_date: date
    sport: Optional[Sport]
    workout_type: Optional[str]
    duration_seconds: Optional[int]
    distance_meters: Optional[float]
    normalized_power: Optional[float]
    avg_hr: Optional[int]
    tss: Optional[float]
    is_breakthrough: bool
    compliance_status: ComplianceStatus
    
    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────────────────────
# DAILY METRICS SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────

class DailyMetricsCreate(BaseModel):
    date: date
    source: str = "manual"
    
    body_battery_min: Optional[int] = None
    body_battery_max: Optional[int] = None
    body_battery_avg: Optional[int] = None
    recovery_score: Optional[int] = None
    recovery_status: Optional[RecoveryStatus] = None
    
    sleep_hours: Optional[float] = None
    sleep_score: Optional[int] = None
    sleep_quality: Optional[str] = None
    
    resting_hr: Optional[int] = None
    hrv: Optional[float] = None
    
    energy_level: Optional[int] = None
    muscle_soreness: Optional[int] = None
    mood: Optional[int] = None
    notes: Optional[str] = None


class DailyMetricsResponse(BaseModel):
    id: int
    date: date
    source: Optional[str]
    recovery_score: Optional[int]
    recovery_status: Optional[RecoveryStatus]
    body_battery_avg: Optional[int]
    sleep_hours: Optional[float]
    resting_hr: Optional[int]
    hrv: Optional[float]
    energy_level: Optional[int]
    notes: Optional[str]
    
    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────────────────────
# DASHBOARD SCHEMAS (the main output for athlete view)
# ─────────────────────────────────────────────────────────────────────────────

class MentalSkillPrescription(BaseModel):
    """Mental skill to practice during the session."""
    skill_name: str
    source_inspiration: Optional[str]  # "Tim Grover", "Kobe Bryant", etc.
    description: str
    when_to_use: str
    how_to_practice: str
    key_phrase: str  # The internal cue
    success_indicator: str


class SessionMindset(BaseModel):
    """Complete mental framework for a session."""
    amateur_narrative: str  # What untrained mind thinks
    elite_narrative: str  # How elite athletes frame it
    source_quote: Optional[str]  # Actual quote
    source_attribution: Optional[str]  # Who said it
    attention_strategy: str
    chunk_strategy: str
    mantras: List[str]
    micro_goals: List[str]
    skill_to_practice: Optional[MentalSkillPrescription]


class TodaySession(BaseModel):
    """Today's prescribed workout with context."""
    id: Optional[int]
    title: str
    description: Optional[str]
    purpose: Optional[str]
    duration_minutes: Optional[int]
    session_type: SessionType
    sport: Sport
    is_key_session: bool
    priority: int
    
    # Targets
    target_display: Optional[str]  # e.g., "245-255W" or "6:30-6:45/mi"
    
    # Mundanity context
    why_it_matters: str
    elite_mindset: Optional[str]
    
    # Recovery adjustments
    if_recovery_yellow: Optional[str]
    if_recovery_red: Optional[str]
    
    # Mental skills (from emotional_skills_v2)
    mindset: Optional[SessionMindset] = None


class WeekDay(BaseModel):
    """Single day in the week view."""
    date: date
    day_name: str  # "Mon", "Tue", etc.
    is_today: bool
    session: Optional[TodaySession]
    is_done: bool
    compliance_status: Optional[ComplianceStatus]


class GapAnalysis(BaseModel):
    """Current fitness vs target gaps."""
    ftp_current: Optional[float]
    ftp_target: Optional[float]
    ftp_gap: Optional[float]
    ftp_gap_pct: Optional[float]
    ftp_achievable: bool = True
    
    pace_current: Optional[float]
    pace_target: Optional[float]
    pace_gap: Optional[float]
    pace_gap_pct: Optional[float]
    pace_achievable: bool = True
    
    feasibility_pct: float = 50.0


class LoadMetrics(BaseModel):
    """Training load state."""
    ctl: float = 0  # Chronic Training Load
    atl: float = 0  # Acute Training Load
    tsb: float = 0  # Training Stress Balance
    form: str = "NEUTRAL"  # FRESH, RECOVERED, NEUTRAL, TIRED, OVERREACHED


class AthleteDashboard(BaseModel):
    """Complete dashboard data for athlete view."""
    
    # Header
    athlete_name: str
    avatar_initials: Optional[str]
    
    # Goal
    goal_race_name: Optional[str]
    goal_race_date: Optional[date]
    days_remaining: Optional[int]
    current_phase: Optional[TrainingPhase]
    
    # Recovery
    recovery_status: RecoveryStatus = RecoveryStatus.GREEN
    recovery_score: Optional[int]
    sleep_hours: Optional[float]
    body_battery: Optional[int]
    
    # Today
    today_session: Optional[TodaySession]
    
    # This week
    week_sessions: List[WeekDay]
    week_number: Optional[int]
    key_sessions_total: int = 0
    key_sessions_done: int = 0
    
    # Fitness (hidden by default in UI)
    gap_analysis: Optional[GapAnalysis]
    load_metrics: Optional[LoadMetrics]
    
    # Recent workouts
    recent_workouts: List[WorkoutListItem] = []
    
    # Phase timeline
    phases: List[Dict[str, Any]] = []


# ─────────────────────────────────────────────────────────────────────────────
# COACH DASHBOARD SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────

class AthleteCard(BaseModel):
    """Athlete summary for coach dashboard."""
    id: int
    name: str
    avatar_initials: Optional[str]
    
    # Status indicators
    recovery_status: RecoveryStatus = RecoveryStatus.GREEN
    compliance_7day: Optional[float]  # 0-100%
    
    # Goal progress
    goal_race_name: Optional[str]
    days_to_race: Optional[int]
    current_phase: Optional[TrainingPhase]
    
    # Today
    today_session_type: Optional[SessionType]
    today_session_title: Optional[str]
    today_is_key: bool = False
    
    # Alerts
    needs_attention: bool = False
    attention_reason: Optional[str]


class CoachDashboard(BaseModel):
    """Dashboard data for coach view."""
    athletes: List[AthleteCard]
    total_athletes: int
    athletes_green: int
    athletes_yellow: int
    athletes_red: int
    key_sessions_today: int
