"""
Dashboard Service
=================
Generates the complete dashboard data for athlete and coach views.
This is the "mundanity of excellence" view - showing daily actions in context.
"""

from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_

from models.database import (
    Athlete, TrainingPlan, PlannedSession, ExecutedWorkout, DailyMetrics,
    Sport, SessionType, ComplianceStatus, RecoveryStatus, TrainingPhase
)
from models.schemas import (
    AthleteDashboard, TodaySession, WeekDay, GapAnalysis, LoadMetrics,
    WorkoutListItem, AthleteCard, CoachDashboard, SessionMindset, MentalSkillPrescription
)
from services.workout_service import WorkoutService

# Import emotional skills engine
from core.emotional_skills_v2 import MindsetPrescriptionEngine, EliteMindsetLibrary


class DashboardService:
    """Service for generating dashboard views."""
    
    def __init__(self, db: Session):
        self.db = db
        self.workout_service = WorkoutService(db)
        self.mindset_engine = MindsetPrescriptionEngine()
    
    def get_athlete_dashboard(self, athlete_id: int) -> AthleteDashboard:
        """
        Generate complete dashboard data for an athlete.
        
        This is the main "what do I do today and why does it matter" view.
        """
        athlete = self.db.query(Athlete).filter(Athlete.id == athlete_id).first()
        if not athlete:
            raise ValueError(f"Athlete {athlete_id} not found")
        
        # Get active plan
        plan = self.db.query(TrainingPlan).filter(
            TrainingPlan.athlete_id == athlete_id,
            TrainingPlan.is_active == True
        ).first()
        
        # Get today's recovery metrics
        today = date.today()
        recovery = self.db.query(DailyMetrics).filter(
            DailyMetrics.athlete_id == athlete_id,
            DailyMetrics.date == today
        ).first()
        
        # Get this week's sessions
        week_start = today - timedelta(days=today.weekday())  # Monday
        week_end = week_start + timedelta(days=6)
        
        week_sessions = []
        if plan:
            planned = self.db.query(PlannedSession).filter(
                PlannedSession.plan_id == plan.id,
                PlannedSession.date >= week_start,
                PlannedSession.date <= week_end
            ).order_by(PlannedSession.date).all()
            
            week_sessions = self._build_week_view(planned, athlete_id, week_start)
        else:
            # Generate empty week if no plan
            week_sessions = self._build_empty_week(week_start)
        
        # Get today's session
        today_session = self._get_today_session(plan, athlete, recovery)
        
        # Count key sessions
        key_sessions = [w for w in week_sessions if w.session and w.session.is_key_session]
        key_done = [w for w in key_sessions if w.is_done and w.compliance_status in [
            ComplianceStatus.NAILED, ComplianceStatus.COMPLETED
        ]]
        
        # Calculate days remaining
        days_remaining = None
        if athlete.goal_race_date:
            delta = athlete.goal_race_date - today
            days_remaining = delta.days if delta.days > 0 else 0
        
        # Determine current phase
        current_phase = self._determine_phase(plan, days_remaining)
        
        # Get gap analysis
        gap_analysis = self._calculate_gap_analysis(athlete, days_remaining)
        
        # Get load metrics
        load_metrics = self._get_load_metrics(athlete_id)
        
        # Get recent workouts
        recent = self.workout_service.get_athlete_workouts(athlete_id, limit=5)
        recent_workouts = [
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
            for w in recent
        ]
        
        # Get phase timeline
        phases = self._get_phase_timeline(plan, days_remaining)
        
        return AthleteDashboard(
            athlete_name=athlete.name,
            avatar_initials=athlete.avatar_initials or self._get_initials(athlete.name),
            
            goal_race_name=athlete.goal_race_name,
            goal_race_date=athlete.goal_race_date,
            days_remaining=days_remaining,
            current_phase=current_phase,
            
            recovery_status=self._get_recovery_status(recovery),
            recovery_score=recovery.recovery_score if recovery else None,
            sleep_hours=recovery.sleep_hours if recovery else None,
            body_battery=recovery.body_battery_avg if recovery else None,
            
            today_session=today_session,
            
            week_sessions=week_sessions,
            week_number=self._get_week_number(plan, today),
            key_sessions_total=len(key_sessions),
            key_sessions_done=len(key_done),
            
            gap_analysis=gap_analysis,
            load_metrics=load_metrics,
            
            recent_workouts=recent_workouts,
            phases=phases,
        )
    
    def _build_week_view(
        self, 
        planned: List[PlannedSession], 
        athlete_id: int,
        week_start: date
    ) -> List[WeekDay]:
        """Build the week view with session and completion status."""
        today = date.today()
        days = []
        day_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        
        # Create a dict of planned sessions by date
        session_by_date = {s.date: s for s in planned}
        
        for i in range(7):
            day_date = week_start + timedelta(days=i)
            session = session_by_date.get(day_date)
            
            # Check if workout was done
            workout = None
            if session:
                workout = self.db.query(ExecutedWorkout).filter(
                    ExecutedWorkout.athlete_id == athlete_id,
                    ExecutedWorkout.workout_date == day_date
                ).first()
            
            today_session = None
            if session:
                today_session = TodaySession(
                    id=session.id,
                    title=session.title,
                    description=session.description,
                    purpose=session.purpose,
                    duration_minutes=session.duration_minutes,
                    session_type=session.session_type,
                    sport=session.sport,
                    is_key_session=session.is_key_session,
                    priority=session.priority or 3,
                    target_display=self._format_targets(session),
                    why_it_matters=self._generate_why_it_matters(session),
                    elite_mindset=session.elite_mindset,
                    if_recovery_yellow=session.if_recovery_yellow,
                    if_recovery_red=session.if_recovery_red,
                )
            
            days.append(WeekDay(
                date=day_date,
                day_name=day_names[i],
                is_today=(day_date == today),
                session=today_session,
                is_done=workout is not None,
                compliance_status=workout.compliance_status if workout else None,
            ))
        
        return days
    
    def _build_empty_week(self, week_start: date) -> List[WeekDay]:
        """Build empty week when no plan exists."""
        today = date.today()
        days = []
        day_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        
        for i in range(7):
            day_date = week_start + timedelta(days=i)
            days.append(WeekDay(
                date=day_date,
                day_name=day_names[i],
                is_today=(day_date == today),
                session=None,
                is_done=False,
                compliance_status=None,
            ))
        
        return days
    
    def _get_today_session(
        self, 
        plan: Optional[TrainingPlan], 
        athlete: Athlete,
        recovery: Optional[DailyMetrics]
    ) -> Optional[TodaySession]:
        """Get today's session with full context and mental skills."""
        if not plan:
            return None
        
        today = date.today()
        session = self.db.query(PlannedSession).filter(
            PlannedSession.plan_id == plan.id,
            PlannedSession.date == today
        ).first()
        
        if not session:
            return None
        
        # Generate contextual "why it matters"
        why_it_matters = self._generate_why_it_matters(session, athlete, recovery)
        
        # Generate mental skills prescription from emotional_skills_v2
        mindset = self._generate_mindset(session)
        
        return TodaySession(
            id=session.id,
            title=session.title,
            description=session.description,
            purpose=session.purpose,
            duration_minutes=session.duration_minutes,
            session_type=session.session_type,
            sport=session.sport,
            is_key_session=session.is_key_session,
            priority=session.priority or 3,
            target_display=self._format_targets(session),
            why_it_matters=why_it_matters,
            elite_mindset=session.elite_mindset,
            if_recovery_yellow=session.if_recovery_yellow,
            if_recovery_red=session.if_recovery_red,
            mindset=mindset,
        )
    
    def _generate_mindset(self, session: PlannedSession) -> Optional[SessionMindset]:
        """
        Generate mental skill prescription using emotional_skills_v2.
        
        This connects the physical prescription to the psychological framework
        from Grover, Kobe, MJ, Jackson, etc.
        """
        # Map SessionType enum to the string keys used by emotional_skills_v2
        session_type_map = {
            SessionType.REST: None,  # No mindset needed for rest
            SessionType.RECOVERY: "recovery",
            SessionType.EASY: "long_easy",
            SessionType.ENDURANCE: "long_easy",
            SessionType.TEMPO: "tempo",
            SessionType.THRESHOLD: "threshold",
            SessionType.VO2MAX: "vo2max",
            SessionType.LONG: "long_easy",
            SessionType.RACE: "race",
        }
        
        mindset_type = session_type_map.get(session.session_type)
        if not mindset_type:
            return None
        
        try:
            # Get prescription from the engine
            prescription = self.mindset_engine.prescribe_for_session(
                session_type=mindset_type,
                duration_minutes=session.duration_minutes or 60,
                athlete_level="developing",  # TODO: Track athlete mental skill level
            )
            
            # Convert to our schema
            skill = None
            if prescription.skill_prescription:
                skill = MentalSkillPrescription(
                    skill_name=prescription.skill_prescription.skill_name,
                    source_inspiration=prescription.skill_prescription.source_inspiration,
                    description=prescription.skill_prescription.description,
                    when_to_use=prescription.skill_prescription.when_to_use,
                    how_to_practice=prescription.skill_prescription.how_to_practice,
                    key_phrase=prescription.skill_prescription.key_phrase,
                    success_indicator=prescription.skill_prescription.success_indicator,
                )
            
            return SessionMindset(
                amateur_narrative=prescription.amateur_narrative,
                elite_narrative=prescription.elite_narrative,
                source_quote=prescription.source_quote,
                source_attribution=prescription.source_attribution,
                attention_strategy=prescription.attention_instruction,
                chunk_strategy=prescription.chunk_strategy,
                mantras=prescription.suggested_mantras,
                micro_goals=prescription.micro_goals,
                skill_to_practice=skill,
            )
        except Exception as e:
            # Don't fail the whole dashboard if mindset generation fails
            print(f"Warning: Could not generate mindset: {e}")
            return None
    
    def _generate_why_it_matters(
        self, 
        session: PlannedSession,
        athlete: Optional[Athlete] = None,
        recovery: Optional[DailyMetrics] = None
    ) -> str:
        """
        Generate the "why it matters" context for a session.
        
        This is the core of the mundanity philosophy - connecting
        today's ordinary action to the extraordinary goal.
        """
        # Start with any custom purpose
        if session.purpose:
            base = session.purpose
        else:
            # Generate based on session type
            base = self._default_purpose(session.session_type)
        
        # Add key session context
        if session.is_key_session:
            base = f"⭐ KEY SESSION: {base}"
        
        # Add recovery context if available
        if recovery:
            status = self._get_recovery_status(recovery)
            if status == RecoveryStatus.YELLOW:
                base += f"\n\n⚠️ Recovery is yellow ({recovery.recovery_score}%). Consider: {session.if_recovery_yellow or 'reducing intensity by 10%'}"
            elif status == RecoveryStatus.RED:
                base += f"\n\n🔴 Recovery is red ({recovery.recovery_score}%). Consider: {session.if_recovery_red or 'converting to easy or rest'}"
        
        return base
    
    def _default_purpose(self, session_type: SessionType) -> str:
        """Get default purpose text for session type."""
        purposes = {
            SessionType.REST: "Recovery is training. Your body adapts during rest, not during work. Honor the rest.",
            SessionType.RECOVERY: "Active recovery helps flush yesterday's work. Keep it truly easy - the quality of your next key session depends on today.",
            SessionType.EASY: "Easy aerobic work builds the foundation. This is where champions are made - not in the hard sessions, but in the consistent easy volume.",
            SessionType.ENDURANCE: "Building your aerobic engine. This is investment in race-day durability. Stay patient, stay smooth.",
            SessionType.TEMPO: "Tempo teaches your body what sustainable effort feels like. You're calibrating your race-day engine.",
            SessionType.THRESHOLD: "This is where you get faster. The discomfort is the adaptation signal. You're buying fitness right now.",
            SessionType.VO2MAX: "High-end work that raises your ceiling. Short, hard, valuable. You can do anything for a few minutes.",
            SessionType.LONG: "Your weekly endurance anchor. This builds the durability you'll need on race day. Stay patient.",
            SessionType.RACE: "Execute the plan. Nothing new. You've done this before.",
            SessionType.BRICK: "Teaching your body the bike-to-run transition. This specificity pays dividends on race day.",
            SessionType.STRENGTH: "Building the structural foundation. Strong athletes are resilient athletes.",
            SessionType.DRILL: "Perfecting the details. The difference between good and great is in these small things.",
        }
        return purposes.get(session_type, "Every session is a brick in the wall. Lay it well.")
    
    def _format_targets(self, session: PlannedSession) -> Optional[str]:
        """Format targets for display."""
        parts = []
        
        if session.target_power_low:
            if session.target_power_high:
                parts.append(f"{session.target_power_low}-{session.target_power_high}W")
            else:
                parts.append(f"{session.target_power_low}W")
        
        if session.target_pace_low:
            low = self._format_pace(session.target_pace_low)
            if session.target_pace_high:
                high = self._format_pace(session.target_pace_high)
                parts.append(f"{low}-{high}/mi")
            else:
                parts.append(f"{low}/mi")
        
        if session.target_hr_low:
            if session.target_hr_high:
                parts.append(f"{session.target_hr_low}-{session.target_hr_high}bpm")
            else:
                parts.append(f"{session.target_hr_low}bpm")
        
        if session.target_zone:
            parts.append(f"Z{session.target_zone}")
        
        if session.target_rpe:
            parts.append(f"RPE {session.target_rpe}")
        
        return " | ".join(parts) if parts else None
    
    def _format_pace(self, sec_per_mile: float) -> str:
        """Format pace as M:SS."""
        minutes = int(sec_per_mile // 60)
        seconds = int(sec_per_mile % 60)
        return f"{minutes}:{seconds:02d}"
    
    def _determine_phase(
        self, 
        plan: Optional[TrainingPlan], 
        days_remaining: Optional[int]
    ) -> Optional[TrainingPhase]:
        """Determine current training phase."""
        if days_remaining is None:
            return None
        
        if days_remaining > 84:  # 12+ weeks
            return TrainingPhase.BASE
        elif days_remaining > 42:  # 6-12 weeks
            return TrainingPhase.BUILD
        elif days_remaining > 14:  # 2-6 weeks
            return TrainingPhase.PEAK
        elif days_remaining > 0:
            return TrainingPhase.TAPER
        else:
            return TrainingPhase.RACE
    
    def _calculate_gap_analysis(
        self, 
        athlete: Athlete, 
        days_remaining: Optional[int]
    ) -> Optional[GapAnalysis]:
        """Calculate gaps between current and target fitness."""
        if not (athlete.current_ftp or athlete.current_threshold_pace):
            return None
        
        weeks = (days_remaining or 0) // 7
        
        ftp_gap = None
        ftp_gap_pct = None
        ftp_achievable = True
        
        if athlete.current_ftp and athlete.target_ftp:
            ftp_gap = athlete.target_ftp - athlete.current_ftp
            ftp_gap_pct = (ftp_gap / athlete.current_ftp) * 100
            # ~1.5% per week is realistic
            ftp_achievable = ftp_gap_pct <= (weeks * 1.5)
        
        pace_gap = None
        pace_gap_pct = None
        pace_achievable = True
        
        if athlete.current_threshold_pace and athlete.target_threshold_pace:
            pace_gap = athlete.current_threshold_pace - athlete.target_threshold_pace
            pace_gap_pct = (pace_gap / athlete.current_threshold_pace) * 100
            # ~3 sec/mile per week is realistic
            pace_achievable = pace_gap <= (weeks * 3)
        
        # Calculate feasibility
        feasibility = 50.0
        if ftp_achievable:
            feasibility += 15
        else:
            feasibility -= 15
        if pace_achievable:
            feasibility += 15
        else:
            feasibility -= 15
        if weeks >= 12:
            feasibility += 10
        elif weeks < 6:
            feasibility -= 15
        
        feasibility = max(5, min(95, feasibility))
        
        return GapAnalysis(
            ftp_current=athlete.current_ftp,
            ftp_target=athlete.target_ftp,
            ftp_gap=ftp_gap,
            ftp_gap_pct=ftp_gap_pct,
            ftp_achievable=ftp_achievable,
            
            pace_current=athlete.current_threshold_pace,
            pace_target=athlete.target_threshold_pace,
            pace_gap=pace_gap,
            pace_gap_pct=pace_gap_pct,
            pace_achievable=pace_achievable,
            
            feasibility_pct=feasibility,
        )
    
    def _get_load_metrics(self, athlete_id: int) -> LoadMetrics:
        """Get current training load metrics."""
        metrics = self.workout_service.calculate_load_metrics(athlete_id)
        return LoadMetrics(
            ctl=metrics['ctl'],
            atl=metrics['atl'],
            tsb=metrics['tsb'],
            form=metrics['form'],
        )
    
    def _get_recovery_status(self, recovery: Optional[DailyMetrics]) -> RecoveryStatus:
        """Determine recovery status from metrics."""
        if not recovery:
            return RecoveryStatus.GREEN  # Default to green if no data
        
        if recovery.recovery_status:
            return recovery.recovery_status
        
        score = recovery.recovery_score
        if score is None:
            return RecoveryStatus.GREEN
        
        if score >= 67:
            return RecoveryStatus.GREEN
        elif score >= 34:
            return RecoveryStatus.YELLOW
        else:
            return RecoveryStatus.RED
    
    def _get_initials(self, name: str) -> str:
        """Get initials from name."""
        parts = name.split()
        if len(parts) >= 2:
            return f"{parts[0][0]}{parts[-1][0]}".upper()
        return name[:2].upper()
    
    def _get_week_number(self, plan: Optional[TrainingPlan], today: date) -> Optional[int]:
        """Get current week number within the plan."""
        if not plan or not plan.start_date:
            return None
        
        delta = today - plan.start_date
        return (delta.days // 7) + 1
    
    def _get_phase_timeline(
        self, 
        plan: Optional[TrainingPlan], 
        days_remaining: Optional[int]
    ) -> List[Dict[str, Any]]:
        """Get phase timeline for visualization."""
        if not days_remaining:
            return []
        
        phases = []
        
        if days_remaining > 84:
            phases.append({
                'name': 'BASE',
                'status': 'current' if days_remaining > 84 else 'completed',
                'weeks': max(1, (days_remaining - 84) // 7),
            })
        
        if days_remaining > 42:
            phases.append({
                'name': 'BUILD',
                'status': 'current' if 42 < days_remaining <= 84 else ('completed' if days_remaining <= 42 else 'upcoming'),
                'weeks': min(6, max(1, (min(days_remaining, 84) - 42) // 7)),
            })
        
        if days_remaining > 14:
            phases.append({
                'name': 'PEAK',
                'status': 'current' if 14 < days_remaining <= 42 else ('completed' if days_remaining <= 14 else 'upcoming'),
                'weeks': min(4, max(1, (min(days_remaining, 42) - 14) // 7)),
            })
        
        if days_remaining > 0:
            phases.append({
                'name': 'TAPER',
                'status': 'current' if 0 < days_remaining <= 14 else 'upcoming',
                'weeks': min(2, max(1, days_remaining // 7)),
            })
        
        phases.append({
            'name': 'RACE',
            'status': 'current' if days_remaining <= 0 else 'upcoming',
            'weeks': 0,
        })
        
        return phases
    
    # ─────────────────────────────────────────────────────────────────────────
    # COACH DASHBOARD
    # ─────────────────────────────────────────────────────────────────────────
    
    def get_coach_dashboard(self, coach_id: int) -> CoachDashboard:
        """Generate dashboard for coach view."""
        from models.database import Coach
        
        coach = self.db.query(Coach).filter(Coach.id == coach_id).first()
        if not coach:
            raise ValueError(f"Coach {coach_id} not found")
        
        athletes = self.db.query(Athlete).filter(
            Athlete.coach_id == coach_id
        ).all()
        
        athlete_cards = []
        green_count = 0
        yellow_count = 0
        red_count = 0
        key_today = 0
        
        today = date.today()
        
        for athlete in athletes:
            # Get recovery
            recovery = self.db.query(DailyMetrics).filter(
                DailyMetrics.athlete_id == athlete.id,
                DailyMetrics.date == today
            ).first()
            
            recovery_status = self._get_recovery_status(recovery)
            
            if recovery_status == RecoveryStatus.GREEN:
                green_count += 1
            elif recovery_status == RecoveryStatus.YELLOW:
                yellow_count += 1
            else:
                red_count += 1
            
            # Get compliance
            week_ago = today - timedelta(days=7)
            recent_workouts = self.db.query(ExecutedWorkout).filter(
                ExecutedWorkout.athlete_id == athlete.id,
                ExecutedWorkout.workout_date >= week_ago
            ).all()
            
            compliance = None
            if recent_workouts:
                good = [w for w in recent_workouts if w.compliance_status in [
                    ComplianceStatus.NAILED, ComplianceStatus.COMPLETED
                ]]
                compliance = (len(good) / len(recent_workouts)) * 100
            
            # Get today's session
            plan = self.db.query(TrainingPlan).filter(
                TrainingPlan.athlete_id == athlete.id,
                TrainingPlan.is_active == True
            ).first()
            
            today_session = None
            today_is_key = False
            if plan:
                session = self.db.query(PlannedSession).filter(
                    PlannedSession.plan_id == plan.id,
                    PlannedSession.date == today
                ).first()
                if session:
                    today_session = session
                    today_is_key = session.is_key_session
                    if today_is_key:
                        key_today += 1
            
            # Calculate days to race
            days_to_race = None
            if athlete.goal_race_date:
                delta = athlete.goal_race_date - today
                days_to_race = delta.days if delta.days > 0 else 0
            
            # Check if needs attention
            needs_attention = False
            attention_reason = None
            
            if recovery_status == RecoveryStatus.RED:
                needs_attention = True
                attention_reason = "Recovery in red zone"
            elif compliance is not None and compliance < 50:
                needs_attention = True
                attention_reason = f"Low compliance ({compliance:.0f}%)"
            
            athlete_cards.append(AthleteCard(
                id=athlete.id,
                name=athlete.name,
                avatar_initials=athlete.avatar_initials or self._get_initials(athlete.name),
                recovery_status=recovery_status,
                compliance_7day=compliance,
                goal_race_name=athlete.goal_race_name,
                days_to_race=days_to_race,
                current_phase=self._determine_phase(plan, days_to_race),
                today_session_type=today_session.session_type if today_session else None,
                today_session_title=today_session.title if today_session else None,
                today_is_key=today_is_key,
                needs_attention=needs_attention,
                attention_reason=attention_reason,
            ))
        
        return CoachDashboard(
            athletes=athlete_cards,
            total_athletes=len(athletes),
            athletes_green=green_count,
            athletes_yellow=yellow_count,
            athletes_red=red_count,
            key_sessions_today=key_today,
        )
