"""
RALPH API
=========
FastAPI application for the coaching platform.

Run with: uvicorn main:app --reload
"""

import os
from datetime import datetime, date, timedelta
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from models.database import (
    init_db, get_engine, get_session_maker,
    Coach, Athlete, TrainingPlan, PlannedSession, ExecutedWorkout, DailyMetrics
)
from models.schemas import (
    AthleteCreate, AthleteUpdate, AthleteResponse, AthleteListItem,
    TrainingPlanCreate, TrainingPlanResponse,
    PlannedSessionCreate, PlannedSessionResponse,
    WorkoutUploadResponse, WorkoutListItem,
    DailyMetricsCreate, DailyMetricsResponse,
    AthleteDashboard, CoachDashboard,
)
from services.workout_service import WorkoutService
from services.dashboard_service import DashboardService


# ─────────────────────────────────────────────────────────────────────────────
# DATABASE SETUP
# ─────────────────────────────────────────────────────────────────────────────

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ralph.db")
engine = init_db(DATABASE_URL)
SessionLocal = get_session_maker(engine)


def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# APP SETUP
# ─────────────────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown."""
    db = SessionLocal()
    try:
        coach = db.query(Coach).first()
        if not coach:
            demo_coach = Coach(
                email="coach@ralph.dev",
                name="Demo Coach",
                password_hash="demo_hash"
            )
            db.add(demo_coach)
            db.commit()
            print("✓ Created demo coach: coach@ralph.dev")
    except Exception as e:
        print(f"Warning: Could not create demo data: {e}")
    finally:
        db.close()
    yield


app = FastAPI(
    title="RALPH",
    description="Real-time Athlete Learning & Performance Handler",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "name": "RALPH",
        "description": "Real-time Athlete Learning & Performance Handler",
        "version": "0.1.0",
        "status": "healthy",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


# ─────────────────────────────────────────────────────────────────────────────
# ATHLETES
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/athletes", response_model=AthleteResponse)
def create_athlete(
    athlete: AthleteCreate,
    coach_id: int = Query(..., description="Coach ID"),
    db: Session = Depends(get_db)
):
    """Create a new athlete."""
    coach = db.query(Coach).filter(Coach.id == coach_id).first()
    if not coach:
        raise HTTPException(status_code=404, detail="Coach not found")
    
    existing = db.query(Athlete).filter(Athlete.email == athlete.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_athlete = Athlete(
        coach_id=coach_id,
        name=athlete.name,
        email=athlete.email,
        avatar_initials=athlete.avatar_initials or _get_initials(athlete.name),
        goal_race_name=athlete.goal_race_name,
        goal_race_date=athlete.goal_race_date,
        goal_time_seconds=athlete.goal_time_seconds,
        goal_type=athlete.goal_type,
        current_ftp=athlete.current_ftp,
        current_threshold_pace=athlete.current_threshold_pace,
        target_ftp=athlete.target_ftp,
        target_threshold_pace=athlete.target_threshold_pace,
    )
    
    db.add(db_athlete)
    db.commit()
    db.refresh(db_athlete)
    return db_athlete


@app.get("/api/athletes", response_model=List[AthleteListItem])
def list_athletes(
    coach_id: int = Query(..., description="Coach ID"),
    db: Session = Depends(get_db)
):
    """List all athletes for a coach."""
    athletes = db.query(Athlete).filter(Athlete.coach_id == coach_id).all()
    result = []
    today = date.today()
    
    for athlete in athletes:
        days_to_race = None
        if athlete.goal_race_date:
            delta = athlete.goal_race_date - today
            days_to_race = delta.days if delta.days > 0 else 0
        
        recovery = db.query(DailyMetrics).filter(
            DailyMetrics.athlete_id == athlete.id,
            DailyMetrics.date == today
        ).first()
        
        recovery_status = recovery.recovery_status if recovery else None
        
        current_phase = None
        if days_to_race:
            if days_to_race > 84:
                current_phase = "base"
            elif days_to_race > 42:
                current_phase = "build"
            elif days_to_race > 14:
                current_phase = "peak"
            else:
                current_phase = "taper"
        
        result.append(AthleteListItem(
            id=athlete.id,
            name=athlete.name,
            avatar_initials=athlete.avatar_initials,
            goal_race_name=athlete.goal_race_name,
            goal_race_date=athlete.goal_race_date,
            days_to_race=days_to_race,
            current_phase=current_phase,
            recovery_status=recovery_status,
            compliance_rate=None,
        ))
    
    return result


@app.get("/api/athletes/{athlete_id}", response_model=AthleteResponse)
def get_athlete(athlete_id: int, db: Session = Depends(get_db)):
    """Get athlete details."""
    athlete = db.query(Athlete).filter(Athlete.id == athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")
    return athlete


@app.put("/api/athletes/{athlete_id}", response_model=AthleteResponse)
def update_athlete(
    athlete_id: int,
    updates: AthleteUpdate,
    db: Session = Depends(get_db)
):
    """Update athlete details."""
    athlete = db.query(Athlete).filter(Athlete.id == athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(athlete, field, value)
    
    db.commit()
    db.refresh(athlete)
    return athlete


@app.delete("/api/athletes/{athlete_id}")
def delete_athlete(athlete_id: int, db: Session = Depends(get_db)):
    """Delete an athlete."""
    athlete = db.query(Athlete).filter(Athlete.id == athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")
    
    db.delete(athlete)
    db.commit()
    return {"status": "deleted"}


# ─────────────────────────────────────────────────────────────────────────────
# DASHBOARD
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/athletes/{athlete_id}/dashboard", response_model=AthleteDashboard)
def get_athlete_dashboard(athlete_id: int, db: Session = Depends(get_db)):
    """Get the complete dashboard for an athlete."""
    service = DashboardService(db)
    try:
        return service.get_athlete_dashboard(athlete_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/api/coach/{coach_id}/dashboard", response_model=CoachDashboard)
def get_coach_dashboard(coach_id: int, db: Session = Depends(get_db)):
    """Get the coach dashboard showing all athletes."""
    service = DashboardService(db)
    try:
        return service.get_coach_dashboard(coach_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────────
# WORKOUTS
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/workouts/upload", response_model=WorkoutUploadResponse)
async def upload_workout(
    athlete_id: int = Query(..., description="Athlete ID"),
    file: UploadFile = File(...),
    workout_date: Optional[date] = Query(None, description="Override workout date"),
    db: Session = Depends(get_db)
):
    """Upload and process a FIT file."""
    if not file.filename.endswith(('.fit', '.fit.gz')):
        raise HTTPException(status_code=400, detail="File must be a .fit or .fit.gz file")
    
    content = await file.read()
    service = WorkoutService(db)
    
    try:
        return service.process_fit_file(
            athlete_id=athlete_id,
            file_content=content,
            filename=file.filename,
            workout_date=workout_date,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/athletes/{athlete_id}/workouts", response_model=List[WorkoutListItem])
def list_workouts(
    athlete_id: int,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """List recent workouts for an athlete."""
    service = WorkoutService(db)
    workouts = service.get_athlete_workouts(athlete_id, limit)
    
    return [
        WorkoutListItem(
            id=w.id,
            workout_date=w.workout_date,
            sport=w.sport,
            workout_type=w.workout_type,
            duration_seconds=w.duration_seconds,
            distance_meters=w.distance_meters,
            normalized_power=w.normalized_power,
            avg_hr=w.avg_hr,
            tss=w.tss,
            is_breakthrough=w.is_breakthrough,
            compliance_status=w.compliance_status,
        )
        for w in workouts
    ]


# ─────────────────────────────────────────────────────────────────────────────
# TRAINING PLANS
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/athletes/{athlete_id}/plans", response_model=TrainingPlanResponse)
def create_plan(
    athlete_id: int,
    plan: TrainingPlanCreate,
    db: Session = Depends(get_db)
):
    """Create a training plan for an athlete."""
    athlete = db.query(Athlete).filter(Athlete.id == athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")
    
    db.query(TrainingPlan).filter(
        TrainingPlan.athlete_id == athlete_id,
        TrainingPlan.is_active == True
    ).update({"is_active": False})
    
    total_weeks = ((plan.end_date - plan.start_date).days // 7) + 1
    
    db_plan = TrainingPlan(
        athlete_id=athlete_id,
        name=plan.name,
        description=plan.description,
        start_date=plan.start_date,
        end_date=plan.end_date,
        total_weeks=total_weeks,
        is_active=True,
        phases=[p.model_dump() for p in plan.phases] if plan.phases else None,
        progressions=[p.model_dump() for p in plan.progressions] if plan.progressions else None,
    )
    
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan


@app.get("/api/athletes/{athlete_id}/plans", response_model=List[TrainingPlanResponse])
def list_plans(athlete_id: int, db: Session = Depends(get_db)):
    """List all plans for an athlete."""
    plans = db.query(TrainingPlan).filter(
        TrainingPlan.athlete_id == athlete_id
    ).order_by(TrainingPlan.created_at.desc()).all()
    return plans


@app.get("/api/plans/{plan_id}", response_model=TrainingPlanResponse)
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    """Get plan details."""
    plan = db.query(TrainingPlan).filter(TrainingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


# ─────────────────────────────────────────────────────────────────────────────
# PLANNED SESSIONS
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/plans/{plan_id}/sessions", response_model=PlannedSessionResponse)
def create_session(
    plan_id: int,
    session: PlannedSessionCreate,
    db: Session = Depends(get_db)
):
    """Add a session to a training plan."""
    plan = db.query(TrainingPlan).filter(TrainingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    week_number = ((session.date - plan.start_date).days // 7) + 1
    
    db_session = PlannedSession(
        plan_id=plan_id,
        date=session.date,
        day_of_week=session.date.weekday(),
        week_number=week_number,
        sport=session.sport,
        session_type=session.session_type,
        title=session.title,
        description=session.description,
        purpose=session.purpose,
        duration_minutes=session.duration_minutes,
        distance_meters=session.distance_meters,
        target_pace_low=session.target_pace_low,
        target_pace_high=session.target_pace_high,
        target_power_low=session.target_power_low,
        target_power_high=session.target_power_high,
        target_hr_low=session.target_hr_low,
        target_hr_high=session.target_hr_high,
        target_rpe=session.target_rpe,
        target_zone=session.target_zone,
        structure=session.structure,
        is_key_session=session.is_key_session,
        priority=session.priority,
        if_recovery_yellow=session.if_recovery_yellow,
        if_recovery_red=session.if_recovery_red,
        elite_mindset=session.elite_mindset,
    )
    
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


@app.get("/api/plans/{plan_id}/sessions", response_model=List[PlannedSessionResponse])
def list_sessions(
    plan_id: int,
    week: Optional[int] = Query(None, description="Filter by week number"),
    db: Session = Depends(get_db)
):
    """List sessions in a plan."""
    query = db.query(PlannedSession).filter(PlannedSession.plan_id == plan_id)
    if week:
        query = query.filter(PlannedSession.week_number == week)
    sessions = query.order_by(PlannedSession.date).all()
    return sessions


@app.put("/api/sessions/{session_id}", response_model=PlannedSessionResponse)
def update_session(
    session_id: int,
    updates: PlannedSessionCreate,
    db: Session = Depends(get_db)
):
    """Update a planned session."""
    session = db.query(PlannedSession).filter(PlannedSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(session, field, value)
    
    db.commit()
    db.refresh(session)
    return session


@app.delete("/api/sessions/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db)):
    """Delete a planned session."""
    session = db.query(PlannedSession).filter(PlannedSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.delete(session)
    db.commit()
    return {"status": "deleted"}


# ─────────────────────────────────────────────────────────────────────────────
# DAILY METRICS
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/athletes/{athlete_id}/metrics", response_model=DailyMetricsResponse)
def log_metrics(
    athlete_id: int,
    metrics: DailyMetricsCreate,
    db: Session = Depends(get_db)
):
    """Log daily recovery/wellness metrics."""
    athlete = db.query(Athlete).filter(Athlete.id == athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")
    
    existing = db.query(DailyMetrics).filter(
        DailyMetrics.athlete_id == athlete_id,
        DailyMetrics.date == metrics.date
    ).first()
    
    if existing:
        update_data = metrics.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(existing, field, value)
        db.commit()
        db.refresh(existing)
        return existing
    
    db_metrics = DailyMetrics(
        athlete_id=athlete_id,
        date=metrics.date,
        source=metrics.source,
        body_battery_min=metrics.body_battery_min,
        body_battery_max=metrics.body_battery_max,
        body_battery_avg=metrics.body_battery_avg,
        recovery_score=metrics.recovery_score,
        recovery_status=metrics.recovery_status,
        sleep_hours=metrics.sleep_hours,
        sleep_score=metrics.sleep_score,
        sleep_quality=metrics.sleep_quality,
        resting_hr=metrics.resting_hr,
        hrv=metrics.hrv,
        energy_level=metrics.energy_level,
        muscle_soreness=metrics.muscle_soreness,
        mood=metrics.mood,
        notes=metrics.notes,
    )
    
    db.add(db_metrics)
    db.commit()
    db.refresh(db_metrics)
    return db_metrics


@app.get("/api/athletes/{athlete_id}/metrics", response_model=List[DailyMetricsResponse])
def list_metrics(
    athlete_id: int,
    days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db)
):
    """List recent daily metrics for an athlete."""
    cutoff = date.today() - timedelta(days=days)
    
    metrics = db.query(DailyMetrics).filter(
        DailyMetrics.athlete_id == athlete_id,
        DailyMetrics.date >= cutoff
    ).order_by(DailyMetrics.date.desc()).all()
    
    return metrics


# ─────────────────────────────────────────────────────────────────────────────
# UTILITIES
# ─────────────────────────────────────────────────────────────────────────────

def _get_initials(name: str) -> str:
    """Get initials from name."""
    parts = name.split()
    if len(parts) >= 2:
        return f"{parts[0][0]}{parts[-1][0]}".upper()
    return name[:2].upper()


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
