"""
Training Plan Module
====================
Contextualizes individual workouts within periodized training structure.

Hierarchy:
  Macrocycle (race preparation, 12-20 weeks)
    â””â”€â”€ Mesocycle (training block, 3-6 weeks)
          â””â”€â”€ Microcycle (week)
                â””â”€â”€ PlannedSession (daily prescription)
                      â””â”€â”€ ExecutedWorkout (what actually happened)

This module provides:
1. Periodization structure (macro â†’ meso â†’ micro)
2. Progressive overload tracking
3. Planned vs. actual comparison
4. Workout sequencing with dependencies
5. Key session identification
6. Block-level adaptation goals
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, List, Dict, Any, Tuple
from copy import deepcopy
import json

from .auto_evaluator import (
    GoalState,
    CurrentState,
    WorkoutEvaluation,
    TrainingPhase,
    AdaptationSignal,
)


class BlockType(Enum):
    """Mesocycle block types with specific adaptation goals."""
    RECOVERY = "recovery"           # Absorb fitness, reduce fatigue
    BASE_AEROBIC = "base_aerobic"   # Build aerobic engine, volume focus
    BASE_STRENGTH = "base_strength" # Gym work, force production
    BUILD_THRESHOLD = "build_threshold"  # LT/FTP development
    BUILD_VO2MAX = "build_vo2max"   # High-end aerobic power
    PEAK_SPECIFIC = "peak_specific" # Race-pace, course simulation
    TAPER = "taper"                 # Sharpen, shed fatigue
    RACE = "race"                   # Competition


class SessionRole(Enum):
    """Role of a session within the weekly microcycle."""
    KEY_LONG = "key_long"           # Week's long session - load bearing
    KEY_INTENSITY = "key_intensity" # Primary quality session
    KEY_SECONDARY = "key_secondary" # Secondary quality session
    SUPPORT = "support"             # Supports key sessions (easy aerobic)
    RECOVERY = "recovery"           # Active recovery
    REST = "rest"                   # Complete rest
    BRICK = "brick"                 # Multi-sport transition
    RACE = "race"                   # Competition
    TEST = "test"                   # Fitness assessment


class ComplianceStatus(Enum):
    """How well the executed workout matched the plan."""
    NAILED = "nailed"               # Hit all targets
    COMPLETED = "completed"         # Did the session, minor variance
    MODIFIED = "modified"           # Significant adaptation (recovery-based)
    PARTIAL = "partial"             # Cut short or reduced
    MISSED = "missed"               # Did not execute
    SWAPPED = "swapped"             # Did different session
    EXCEEDED = "exceeded"           # Went beyond prescription (caution)


@dataclass
class ProgressionTarget:
    """Defines progressive overload targets for a metric."""
    metric: str                     # e.g., "long_run_duration", "threshold_power"
    start_value: float
    end_value: float
    current_value: float = 0.0
    unit: str = ""
    
    # Progression rules
    weekly_increment: float = 0.0   # Absolute increase per week
    weekly_increment_pct: float = 0.0  # Percentage increase per week
    max_single_jump: float = 0.0    # Safety cap on single-week increase
    
    # Recovery week behavior
    recovery_week_pct: float = 0.7  # Reduce to 70% on recovery weeks
    
    def target_for_week(self, week_num: int, total_weeks: int, is_recovery: bool = False) -> float:
        """Calculate target value for a specific week."""
        if is_recovery:
            return self.current_value * self.recovery_week_pct
            
        # Linear progression from start to end
        progress_pct = week_num / max(total_weeks - 1, 1)
        base_target = self.start_value + (self.end_value - self.start_value) * progress_pct
        
        # Apply weekly increment if specified
        if self.weekly_increment > 0:
            base_target = self.start_value + (self.weekly_increment * week_num)
            
        if self.weekly_increment_pct > 0:
            base_target = self.start_value * ((1 + self.weekly_increment_pct / 100) ** week_num)
            
        # Cap at end value
        return min(base_target, self.end_value)


@dataclass
class PlannedSession:
    """A prescribed workout within the training plan."""
    # Identity
    id: str                         # Unique identifier
    date: datetime
    day_of_week: int                # 0=Monday, 6=Sunday
    week_number: int                # Within macrocycle
    
    # Classification
    sport: str                      # "run", "bike", "swim", "strength"
    session_type: str               # "easy", "tempo", "intervals", "long", etc.
    role: SessionRole               # Role in the weekly structure
    
    # Prescription
    description: str                # Human-readable description
    duration_minutes: int
    distance_target: Optional[float] = None  # meters or miles
    
    # Intensity targets
    target_power_low: Optional[int] = None   # Watts
    target_power_high: Optional[int] = None
    target_hr_low: Optional[int] = None      # BPM
    target_hr_high: Optional[int] = None
    target_pace_low: Optional[float] = None  # sec/mile or sec/km
    target_pace_high: Optional[float] = None
    target_rpe: Optional[int] = None         # 1-10
    target_zone: Optional[int] = None        # 1-6
    
    # Structure
    warmup_minutes: int = 10
    main_set_description: str = ""
    cooldown_minutes: int = 10
    intervals: List[Dict[str, Any]] = field(default_factory=list)
    
    # Context
    purpose: str = ""               # Why this session matters
    adaptation_target: AdaptationSignal = None
    prerequisites: List[str] = field(default_factory=list)  # Session IDs that should precede
    
    # Flexibility
    is_key_session: bool = False    # Cannot be skipped without consequence
    can_swap_with: List[str] = field(default_factory=list)  # Alternative session IDs
    recovery_modification: str = "" # What to do if recovery is yellow/red
    
    # Execution tracking
    executed: bool = False
    execution_date: Optional[datetime] = None
    compliance: ComplianceStatus = ComplianceStatus.MISSED
    actual_workout: Optional[WorkoutEvaluation] = None
    compliance_notes: str = ""
    
    def matches_workout(self, workout: WorkoutEvaluation) -> Tuple[bool, float]:
        """
        Determine if an executed workout matches this planned session.
        Returns (is_match, confidence_score).
        """
        score = 0.0
        
        # Same sport?
        if workout.sport.lower() == self.sport.lower():
            score += 0.3
        elif workout.sport.lower() in ['cycling', 'bike'] and self.sport.lower() in ['cycling', 'bike']:
            score += 0.3
            
        # Similar duration? (within 20%)
        duration_diff = abs(workout.duration_seconds / 60 - self.duration_minutes)
        if duration_diff < self.duration_minutes * 0.2:
            score += 0.3
        elif duration_diff < self.duration_minutes * 0.4:
            score += 0.15
            
        # Similar intensity?
        if self.target_power_low and workout.normalized_power:
            if self.target_power_low <= workout.normalized_power <= (self.target_power_high or self.target_power_low * 1.1):
                score += 0.3
            elif workout.normalized_power > self.target_power_low * 0.8:
                score += 0.15
                
        # Same date?
        if workout.workout_date.date() == self.date.date():
            score += 0.1
            
        return score > 0.5, score
    
    def evaluate_compliance(self, workout: WorkoutEvaluation) -> ComplianceStatus:
        """Evaluate how well the workout matched the prescription."""
        if not workout:
            return ComplianceStatus.MISSED
            
        issues = []
        
        # Duration check
        duration_pct = (workout.duration_seconds / 60) / self.duration_minutes
        if duration_pct < 0.7:
            issues.append("duration_short")
        elif duration_pct > 1.3:
            issues.append("duration_long")
            
        # Intensity check
        if self.target_power_low and workout.normalized_power:
            if workout.normalized_power < self.target_power_low * 0.9:
                issues.append("underpowered")
            elif workout.normalized_power > (self.target_power_high or self.target_power_low * 1.1) * 1.1:
                issues.append("overpowered")
                
        # Determine status
        if not issues:
            return ComplianceStatus.NAILED
        elif "duration_short" in issues and len(issues) == 1:
            return ComplianceStatus.PARTIAL
        elif "overpowered" in issues or "duration_long" in issues:
            return ComplianceStatus.EXCEEDED
        elif len(issues) == 1:
            return ComplianceStatus.COMPLETED
        else:
            return ComplianceStatus.MODIFIED


@dataclass
class Microcycle:
    """A training week within a mesocycle."""
    week_number: int                # Within macrocycle (1-indexed)
    start_date: datetime
    
    # Classification
    block_type: BlockType           # Inherited from parent mesocycle
    is_recovery_week: bool = False  # Reduced load week
    is_test_week: bool = False      # Contains fitness assessment
    is_race_week: bool = False
    
    # Sessions
    sessions: List[PlannedSession] = field(default_factory=list)
    
    # Load targets
    planned_hours: float = 0.0
    planned_tss: float = 0.0
    planned_intensity_distribution: Dict[str, float] = field(default_factory=dict)
    
    # Progressive overload targets for this week
    progression_targets: Dict[str, float] = field(default_factory=dict)
    
    # Execution summary
    actual_hours: float = 0.0
    actual_tss: float = 0.0
    compliance_rate: float = 0.0    # % of key sessions completed satisfactorily
    
    def get_key_sessions(self) -> List[PlannedSession]:
        """Return sessions that are load-bearing."""
        return [s for s in self.sessions if s.is_key_session or s.role in [
            SessionRole.KEY_LONG, SessionRole.KEY_INTENSITY, SessionRole.KEY_SECONDARY
        ]]
    
    def get_session_by_day(self, day: int) -> List[PlannedSession]:
        """Get sessions for a specific day of week (0=Mon)."""
        return [s for s in self.sessions if s.day_of_week == day]
    
    def calculate_compliance(self) -> float:
        """Calculate compliance rate for key sessions."""
        key_sessions = self.get_key_sessions()
        if not key_sessions:
            return 1.0
            
        successful = sum(1 for s in key_sessions if s.compliance in [
            ComplianceStatus.NAILED, ComplianceStatus.COMPLETED
        ])
        return successful / len(key_sessions)
    
    def summary(self) -> Dict[str, Any]:
        """Generate week summary."""
        executed = [s for s in self.sessions if s.executed]
        key = self.get_key_sessions()
        
        return {
            'week_number': self.week_number,
            'start_date': self.start_date.isoformat(),
            'block_type': self.block_type.value,
            'is_recovery_week': self.is_recovery_week,
            'planned': {
                'sessions': len(self.sessions),
                'hours': self.planned_hours,
                'tss': self.planned_tss,
            },
            'actual': {
                'sessions': len(executed),
                'hours': self.actual_hours,
                'tss': self.actual_tss,
            },
            'key_sessions': {
                'total': len(key),
                'completed': sum(1 for s in key if s.compliance in [
                    ComplianceStatus.NAILED, ComplianceStatus.COMPLETED
                ]),
            },
            'compliance_rate': self.calculate_compliance(),
        }


@dataclass
class Mesocycle:
    """A training block (3-6 weeks) with specific adaptation focus."""
    name: str                       # e.g., "Base Build 1", "VO2max Block"
    block_type: BlockType
    block_number: int               # Within macrocycle
    
    # Timing
    start_date: datetime
    weeks: int                      # Duration in weeks
    
    # Adaptation goals
    primary_adaptation: Optional[AdaptationSignal] = None
    secondary_adaptations: List[AdaptationSignal] = field(default_factory=list)
    
    # Which week is recovery (-1 = last)
    recovery_week_position: int = -1
    
    # Load parameters
    weekly_hours_start: float = 0.0
    weekly_hours_peak: float = 0.0
    intensity_distribution: Dict[str, float] = field(default_factory=dict)
    
    # Key sessions per week
    key_session_types: List[str] = field(default_factory=list)
    
    # Progressive overload
    progressions: List[ProgressionTarget] = field(default_factory=list)
    
    # Microcycles
    microcycles: List[Microcycle] = field(default_factory=list)
    
    # Entry/exit criteria
    entry_fitness_requirements: Dict[str, float] = field(default_factory=dict)
    exit_benchmarks: Dict[str, float] = field(default_factory=dict)
    
    def generate_microcycles(self, macro_week_start: int) -> List[Microcycle]:
        """Generate the weekly structure for this block."""
        microcycles = []
        
        recovery_week = self.recovery_week_position
        if recovery_week == -1:
            recovery_week = self.weeks - 1  # Last week
            
        for i in range(self.weeks):
            is_recovery = (i == recovery_week)
            
            week = Microcycle(
                week_number=macro_week_start + i,
                start_date=self.start_date + timedelta(weeks=i),
                block_type=self.block_type,
                is_recovery_week=is_recovery,
            )
            
            # Set load targets
            if is_recovery:
                week.planned_hours = self.weekly_hours_peak * 0.6
            else:
                # Progressive build through the block
                progress = i / max(self.weeks - 2, 1)  # Exclude recovery week
                week.planned_hours = self.weekly_hours_start + (
                    self.weekly_hours_peak - self.weekly_hours_start
                ) * progress
                
            # Calculate progression targets for this week
            for prog in self.progressions:
                week.progression_targets[prog.metric] = prog.target_for_week(
                    i, self.weeks, is_recovery
                )
                
            microcycles.append(week)
            
        self.microcycles = microcycles
        return microcycles
    
    def summary(self) -> Dict[str, Any]:
        """Generate block summary."""
        return {
            'name': self.name,
            'block_type': self.block_type.value,
            'weeks': self.weeks,
            'primary_adaptation': self.primary_adaptation.value if self.primary_adaptation else None,
            'hours_range': f"{self.weekly_hours_start:.1f}-{self.weekly_hours_peak:.1f}",
            'microcycles': [m.summary() for m in self.microcycles],
        }


@dataclass
class Macrocycle:
    """Complete race preparation plan."""
    name: str                       # e.g., "Ironman 70.3 Santa Cruz Prep"
    goal: GoalState
    
    # Timing
    start_date: datetime
    total_weeks: int
    
    # Structure
    mesocycles: List[Mesocycle] = field(default_factory=list)
    
    # Global progressions
    progressions: List[ProgressionTarget] = field(default_factory=list)
    
    # Current position
    current_week: int = 1
    current_mesocycle_idx: int = 0
    
    def get_current_week(self) -> Optional[Microcycle]:
        """Get the current training week."""
        for meso in self.mesocycles:
            for micro in meso.microcycles:
                if micro.week_number == self.current_week:
                    return micro
        return None
    
    def get_current_mesocycle(self) -> Optional[Mesocycle]:
        """Get the current training block."""
        if 0 <= self.current_mesocycle_idx < len(self.mesocycles):
            return self.mesocycles[self.current_mesocycle_idx]
        return None
    
    def get_week(self, week_num: int) -> Optional[Microcycle]:
        """Get a specific week by number."""
        for meso in self.mesocycles:
            for micro in meso.microcycles:
                if micro.week_number == week_num:
                    return micro
        return None
    
    def advance_week(self):
        """Move to next week, updating mesocycle if needed."""
        self.current_week += 1
        
        # Check if we've moved to a new mesocycle
        current_meso = self.get_current_mesocycle()
        if current_meso:
            last_week = max(m.week_number for m in current_meso.microcycles)
            if self.current_week > last_week:
                self.current_mesocycle_idx += 1
    
    def summary(self) -> Dict[str, Any]:
        """Generate plan summary."""
        return {
            'name': self.name,
            'goal': {
                'race': self.goal.race_name,
                'date': self.goal.race_date.isoformat(),
                'days_remaining': self.goal.days_remaining(),
            },
            'structure': {
                'total_weeks': self.total_weeks,
                'current_week': self.current_week,
                'mesocycles': len(self.mesocycles),
            },
            'mesocycles': [m.summary() for m in self.mesocycles],
            'progressions': [
                {
                    'metric': p.metric,
                    'start': p.start_value,
                    'end': p.end_value,
                    'current': p.current_value,
                    'unit': p.unit,
                }
                for p in self.progressions
            ],
        }


class PlanBuilder:
    """
    Builds periodized training plans based on goal and current fitness.
    """
    
    def __init__(self, goal: GoalState, current: CurrentState):
        self.goal = goal
        self.current = current
        
    def build_plan(self) -> Macrocycle:
        """Generate a complete macrocycle for the goal."""
        weeks_available = self.goal.days_remaining() // 7
        
        if weeks_available < 4:
            return self._build_crisis_plan(weeks_available)
        elif weeks_available < 8:
            return self._build_compressed_plan(weeks_available)
        elif weeks_available < 12:
            return self._build_standard_plan(weeks_available)
        else:
            return self._build_full_plan(weeks_available)
    
    def _build_full_plan(self, weeks: int) -> Macrocycle:
        """Build a full periodized plan (12+ weeks)."""
        start_date = datetime.now()
        
        macro = Macrocycle(
            name=f"{self.goal.race_name} Preparation",
            goal=self.goal,
            start_date=start_date,
            total_weeks=weeks,
        )
        
        # Define progressions
        macro.progressions = self._define_progressions(weeks)
        
        # Calculate block durations
        # Typical split: 40% base, 30% build, 20% peak, 10% taper
        base_weeks = max(4, int(weeks * 0.4))
        build_weeks = max(3, int(weeks * 0.3))
        peak_weeks = max(2, int(weeks * 0.2))
        taper_weeks = max(1, weeks - base_weeks - build_weeks - peak_weeks)
        
        week_counter = 1
        
        # Base block
        base = Mesocycle(
            name="Aerobic Base",
            block_type=BlockType.BASE_AEROBIC,
            block_number=1,
            start_date=start_date,
            weeks=base_weeks,
            primary_adaptation=AdaptationSignal.AEROBIC_EFFICIENCY,
            secondary_adaptations=[AdaptationSignal.FATIGUE_RESISTANCE],
            weekly_hours_start=self.current.current_weekly_volume or 6,
            weekly_hours_peak=(self.current.current_weekly_volume or 6) * 1.3,
            key_session_types=["long_aerobic", "tempo"],
            intensity_distribution={"Z1": 0.10, "Z2": 0.70, "Z3": 0.15, "Z4": 0.05},
        )
        base.progressions = [
            ProgressionTarget(
                metric="long_session_duration",
                start_value=self.current.current_long_duration or 60,
                end_value=(self.current.current_long_duration or 60) * 1.5,
                unit="minutes",
                weekly_increment=10,
                max_single_jump=15,
            ),
        ]
        base.generate_microcycles(week_counter)
        macro.mesocycles.append(base)
        week_counter += base_weeks
        
        # Build block
        build = Mesocycle(
            name="Threshold Development",
            block_type=BlockType.BUILD_THRESHOLD,
            block_number=2,
            start_date=start_date + timedelta(weeks=base_weeks),
            weeks=build_weeks,
            primary_adaptation=AdaptationSignal.THRESHOLD_POWER,
            secondary_adaptations=[AdaptationSignal.AEROBIC_EFFICIENCY],
            weekly_hours_start=base.weekly_hours_peak,
            weekly_hours_peak=base.weekly_hours_peak * 1.1,
            key_session_types=["threshold_intervals", "tempo", "long_with_quality"],
            intensity_distribution={"Z1": 0.10, "Z2": 0.55, "Z3": 0.10, "Z4": 0.20, "Z5": 0.05},
        )
        build.progressions = [
            ProgressionTarget(
                metric="threshold_interval_duration",
                start_value=15,  # 15 min at threshold
                end_value=30,    # 30 min at threshold
                unit="minutes",
                weekly_increment=3,
            ),
        ]
        build.generate_microcycles(week_counter)
        macro.mesocycles.append(build)
        week_counter += build_weeks
        
        # Peak block
        peak = Mesocycle(
            name="Race-Specific",
            block_type=BlockType.PEAK_SPECIFIC,
            block_number=3,
            start_date=start_date + timedelta(weeks=base_weeks + build_weeks),
            weeks=peak_weeks,
            primary_adaptation=AdaptationSignal.THRESHOLD_PACE,
            secondary_adaptations=[AdaptationSignal.NEUROMUSCULAR],
            weekly_hours_start=build.weekly_hours_peak * 0.95,
            weekly_hours_peak=build.weekly_hours_peak,
            key_session_types=["race_pace", "vo2max", "dress_rehearsal"],
            intensity_distribution={"Z1": 0.10, "Z2": 0.50, "Z3": 0.05, "Z4": 0.25, "Z5": 0.10},
        )
        peak.generate_microcycles(week_counter)
        macro.mesocycles.append(peak)
        week_counter += peak_weeks
        
        # Taper
        taper = Mesocycle(
            name="Taper & Sharpen",
            block_type=BlockType.TAPER,
            block_number=4,
            start_date=start_date + timedelta(weeks=base_weeks + build_weeks + peak_weeks),
            weeks=taper_weeks,
            primary_adaptation=AdaptationSignal.RECOVERY_RATE,
            weekly_hours_start=peak.weekly_hours_peak * 0.7,
            weekly_hours_peak=peak.weekly_hours_peak * 0.4,
            key_session_types=["openers", "race_pace_touches"],
            intensity_distribution={"Z1": 0.20, "Z2": 0.50, "Z3": 0.05, "Z4": 0.20, "Z5": 0.05},
        )
        taper.generate_microcycles(week_counter)
        macro.mesocycles.append(taper)
        
        # Generate sessions for all weeks
        self._populate_sessions(macro)
        
        return macro
    
    def _build_standard_plan(self, weeks: int) -> Macrocycle:
        """Build a standard plan (8-12 weeks)."""
        # Simplified version with fewer blocks
        start_date = datetime.now()
        
        macro = Macrocycle(
            name=f"{self.goal.race_name} Preparation",
            goal=self.goal,
            start_date=start_date,
            total_weeks=weeks,
        )
        
        base_weeks = max(3, weeks // 3)
        build_weeks = max(3, weeks // 3)
        peak_taper_weeks = weeks - base_weeks - build_weeks
        
        # Abbreviated blocks...
        week_counter = 1
        
        base = Mesocycle(
            name="Base/Build",
            block_type=BlockType.BASE_AEROBIC,
            block_number=1,
            start_date=start_date,
            weeks=base_weeks,
            primary_adaptation=AdaptationSignal.AEROBIC_EFFICIENCY,
            weekly_hours_start=self.current.current_weekly_volume or 6,
            weekly_hours_peak=(self.current.current_weekly_volume or 6) * 1.2,
            key_session_types=["long_aerobic", "tempo"],
        )
        base.generate_microcycles(week_counter)
        macro.mesocycles.append(base)
        week_counter += base_weeks
        
        build = Mesocycle(
            name="Build/Sharpen",
            block_type=BlockType.BUILD_THRESHOLD,
            block_number=2,
            start_date=start_date + timedelta(weeks=base_weeks),
            weeks=build_weeks,
            primary_adaptation=AdaptationSignal.THRESHOLD_POWER,
            weekly_hours_start=base.weekly_hours_peak,
            weekly_hours_peak=base.weekly_hours_peak * 1.1,
            key_session_types=["threshold_intervals", "race_pace"],
        )
        build.generate_microcycles(week_counter)
        macro.mesocycles.append(build)
        week_counter += build_weeks
        
        taper = Mesocycle(
            name="Peak & Race",
            block_type=BlockType.TAPER,
            block_number=3,
            start_date=start_date + timedelta(weeks=base_weeks + build_weeks),
            weeks=peak_taper_weeks,
            primary_adaptation=AdaptationSignal.RECOVERY_RATE,
            weekly_hours_start=build.weekly_hours_peak * 0.8,
            weekly_hours_peak=build.weekly_hours_peak * 0.5,
            key_session_types=["openers", "race_pace_touches"],
        )
        taper.generate_microcycles(week_counter)
        macro.mesocycles.append(taper)
        
        self._populate_sessions(macro)
        
        return macro
    
    def _build_compressed_plan(self, weeks: int) -> Macrocycle:
        """Build a compressed plan (4-8 weeks)."""
        start_date = datetime.now()
        
        macro = Macrocycle(
            name=f"{self.goal.race_name} - Compressed",
            goal=self.goal,
            start_date=start_date,
            total_weeks=weeks,
        )
        
        # Two blocks: Build and Taper
        build_weeks = weeks - 2
        taper_weeks = 2
        
        build = Mesocycle(
            name="Compressed Build",
            block_type=BlockType.BUILD_THRESHOLD,
            block_number=1,
            start_date=start_date,
            weeks=build_weeks,
            primary_adaptation=AdaptationSignal.THRESHOLD_POWER,
            weekly_hours_start=self.current.current_weekly_volume or 6,
            weekly_hours_peak=(self.current.current_weekly_volume or 6) * 1.15,
            key_session_types=["threshold_intervals", "race_pace", "long_moderate"],
        )
        build.generate_microcycles(1)
        macro.mesocycles.append(build)
        
        taper = Mesocycle(
            name="Quick Taper",
            block_type=BlockType.TAPER,
            block_number=2,
            start_date=start_date + timedelta(weeks=build_weeks),
            weeks=taper_weeks,
            primary_adaptation=AdaptationSignal.RECOVERY_RATE,
            weekly_hours_start=build.weekly_hours_peak * 0.7,
            weekly_hours_peak=build.weekly_hours_peak * 0.4,
            key_session_types=["openers"],
        )
        taper.generate_microcycles(build_weeks + 1)
        macro.mesocycles.append(taper)
        
        self._populate_sessions(macro)
        
        return macro
    
    def _build_crisis_plan(self, weeks: int) -> Macrocycle:
        """Build a crisis plan (<4 weeks) - maintain and sharpen only."""
        start_date = datetime.now()
        
        macro = Macrocycle(
            name=f"{self.goal.race_name} - Crisis Mode",
            goal=self.goal,
            start_date=start_date,
            total_weeks=weeks,
        )
        
        crisis = Mesocycle(
            name="Maintain & Sharpen",
            block_type=BlockType.TAPER,
            block_number=1,
            start_date=start_date,
            weeks=weeks,
            primary_adaptation=AdaptationSignal.RECOVERY_RATE,
            weekly_hours_start=self.current.current_weekly_volume or 5,
            weekly_hours_peak=(self.current.current_weekly_volume or 5) * 0.6,
            key_session_types=["race_pace_touches", "openers"],
        )
        crisis.generate_microcycles(1)
        macro.mesocycles.append(crisis)
        
        self._populate_sessions(macro)
        
        return macro
    
    def _define_progressions(self, weeks: int) -> List[ProgressionTarget]:
        """Define global progressive overload targets."""
        progressions = []
        
        # Long session duration
        progressions.append(ProgressionTarget(
            metric="long_session_duration",
            start_value=self.current.current_long_duration or 60,
            end_value=self.goal.target_long_duration or 120,
            unit="minutes",
            weekly_increment=10,
            max_single_jump=15,
            recovery_week_pct=0.7,
        ))
        
        # Weekly volume
        progressions.append(ProgressionTarget(
            metric="weekly_volume",
            start_value=self.current.current_weekly_volume or 6,
            end_value=self.goal.target_weekly_volume or 10,
            unit="hours",
            weekly_increment_pct=5,  # ~5% per week
            max_single_jump=2,
            recovery_week_pct=0.6,
        ))
        
        # FTP (if cycling goal)
        if self.goal.target_ftp:
            progressions.append(ProgressionTarget(
                metric="ftp",
                start_value=self.current.current_ftp,
                end_value=self.goal.target_ftp,
                unit="watts",
                weekly_increment_pct=1,  # ~1% per week realistic
            ))
            
        return progressions
    
    def _populate_sessions(self, macro: Macrocycle):
        """Populate weekly sessions based on block type and targets."""
        session_id = 1
        
        for meso in macro.mesocycles:
            for micro in meso.microcycles:
                week_sessions = self._generate_week_sessions(
                    micro, meso, macro, session_id
                )
                micro.sessions = week_sessions
                session_id += len(week_sessions)
                
                # Calculate planned hours
                micro.planned_hours = sum(s.duration_minutes for s in week_sessions) / 60
    
    def _generate_week_sessions(
        self, 
        micro: Microcycle, 
        meso: Mesocycle, 
        macro: Macrocycle,
        start_id: int
    ) -> List[PlannedSession]:
        """Generate sessions for a single week."""
        sessions = []
        
        # Get targets for this week
        long_duration = micro.progression_targets.get(
            'long_session_duration', 
            self.current.current_long_duration or 60
        )
        
        # Base weekly structure templates
        if meso.block_type == BlockType.BASE_AEROBIC:
            template = self._base_week_template(micro.is_recovery_week)
        elif meso.block_type == BlockType.BUILD_THRESHOLD:
            template = self._build_week_template(micro.is_recovery_week)
        elif meso.block_type == BlockType.PEAK_SPECIFIC:
            template = self._peak_week_template(micro.is_recovery_week)
        elif meso.block_type == BlockType.TAPER:
            template = self._taper_week_template(micro.is_recovery_week)
        else:
            template = self._base_week_template(micro.is_recovery_week)
            
        # Create sessions from template
        for i, day_template in enumerate(template):
            if day_template is None:
                continue
                
            session = PlannedSession(
                id=f"S{start_id + len(sessions):04d}",
                date=micro.start_date + timedelta(days=i),
                day_of_week=i,
                week_number=micro.week_number,
                sport=day_template.get('sport', 'run'),
                session_type=day_template['type'],
                role=day_template['role'],
                description=day_template['description'],
                duration_minutes=day_template['duration'],
                purpose=day_template.get('purpose', ''),
                is_key_session=day_template['role'] in [
                    SessionRole.KEY_LONG, SessionRole.KEY_INTENSITY, SessionRole.KEY_SECONDARY
                ],
                recovery_modification=day_template.get('recovery_mod', 'Reduce intensity 10%'),
            )
            
            # Adjust long session duration based on progression
            if session.role == SessionRole.KEY_LONG:
                session.duration_minutes = int(long_duration)
                
            # Set intensity targets based on current fitness
            if day_template['type'] in ['threshold', 'tempo']:
                session.target_power_low = int(self.current.current_ftp * 0.88)
                session.target_power_high = int(self.current.current_ftp * 0.95)
                session.target_zone = 4
            elif day_template['type'] in ['easy', 'recovery']:
                session.target_power_low = int(self.current.current_ftp * 0.55)
                session.target_power_high = int(self.current.current_ftp * 0.70)
                session.target_zone = 2
            elif day_template['type'] == 'vo2max':
                session.target_power_low = int(self.current.current_ftp * 1.06)
                session.target_power_high = int(self.current.current_ftp * 1.20)
                session.target_zone = 5
                
            sessions.append(session)
            
        return sessions
    
    def _base_week_template(self, is_recovery: bool) -> List[Optional[Dict]]:
        """Template for base/aerobic weeks."""
        if is_recovery:
            return [
                {'type': 'rest', 'role': SessionRole.REST, 'description': 'Rest', 'duration': 0},
                {'type': 'easy', 'role': SessionRole.RECOVERY, 'description': 'Easy spin', 'duration': 45, 'sport': 'bike'},
                {'type': 'easy', 'role': SessionRole.SUPPORT, 'description': 'Easy run', 'duration': 30, 'sport': 'run'},
                {'type': 'rest', 'role': SessionRole.REST, 'description': 'Rest', 'duration': 0},
                {'type': 'easy', 'role': SessionRole.RECOVERY, 'description': 'Recovery ride', 'duration': 45, 'sport': 'bike'},
                {'type': 'long', 'role': SessionRole.KEY_LONG, 'description': 'Long easy ride (reduced)', 'duration': 60, 'sport': 'bike', 'purpose': 'Maintain aerobic base during recovery'},
                {'type': 'easy', 'role': SessionRole.RECOVERY, 'description': 'Easy jog', 'duration': 30, 'sport': 'run'},
            ]
        return [
            {'type': 'rest', 'role': SessionRole.REST, 'description': 'Rest', 'duration': 0},
            {'type': 'easy', 'role': SessionRole.SUPPORT, 'description': 'Z2 endurance', 'duration': 60, 'sport': 'bike', 'purpose': 'Build aerobic base'},
            {'type': 'easy', 'role': SessionRole.SUPPORT, 'description': 'Easy run + strides', 'duration': 45, 'sport': 'run'},
            {'type': 'tempo', 'role': SessionRole.KEY_SECONDARY, 'description': 'Tempo intervals', 'duration': 60, 'sport': 'bike', 'purpose': 'Introduce threshold stimulus'},
            {'type': 'rest', 'role': SessionRole.REST, 'description': 'Rest', 'duration': 0},
            {'type': 'long', 'role': SessionRole.KEY_LONG, 'description': 'Long Z2 ride', 'duration': 90, 'sport': 'bike', 'purpose': 'Primary aerobic development'},
            {'type': 'easy', 'role': SessionRole.SUPPORT, 'description': 'Easy long run', 'duration': 60, 'sport': 'run'},
        ]
    
    def _build_week_template(self, is_recovery: bool) -> List[Optional[Dict]]:
        """Template for build/threshold weeks."""
        if is_recovery:
            return self._base_week_template(True)  # Same as base recovery
        return [
            {'type': 'rest', 'role': SessionRole.REST, 'description': 'Rest', 'duration': 0},
            {'type': 'threshold', 'role': SessionRole.KEY_INTENSITY, 'description': 'Threshold intervals', 'duration': 70, 'sport': 'bike', 'purpose': 'FTP development'},
            {'type': 'easy', 'role': SessionRole.RECOVERY, 'description': 'Recovery run', 'duration': 35, 'sport': 'run'},
            {'type': 'tempo', 'role': SessionRole.KEY_SECONDARY, 'description': 'Tempo run', 'duration': 50, 'sport': 'run', 'purpose': 'Running threshold development'},
            {'type': 'easy', 'role': SessionRole.SUPPORT, 'description': 'Easy spin', 'duration': 45, 'sport': 'bike'},
            {'type': 'long', 'role': SessionRole.KEY_LONG, 'description': 'Long ride with tempo finish', 'duration': 105, 'sport': 'bike', 'purpose': 'Aerobic endurance + race simulation'},
            {'type': 'easy', 'role': SessionRole.SUPPORT, 'description': 'Easy run', 'duration': 45, 'sport': 'run'},
        ]
    
    def _peak_week_template(self, is_recovery: bool) -> List[Optional[Dict]]:
        """Template for peak/race-specific weeks."""
        if is_recovery:
            return self._base_week_template(True)
        return [
            {'type': 'rest', 'role': SessionRole.REST, 'description': 'Rest', 'duration': 0},
            {'type': 'vo2max', 'role': SessionRole.KEY_INTENSITY, 'description': 'VO2max intervals', 'duration': 60, 'sport': 'bike', 'purpose': 'High-end aerobic power'},
            {'type': 'easy', 'role': SessionRole.RECOVERY, 'description': 'Recovery', 'duration': 30, 'sport': 'run'},
            {'type': 'race_pace', 'role': SessionRole.KEY_SECONDARY, 'description': 'Race pace simulation', 'duration': 50, 'sport': 'run', 'purpose': 'Race-specific preparation'},
            {'type': 'easy', 'role': SessionRole.SUPPORT, 'description': 'Easy spin', 'duration': 45, 'sport': 'bike'},
            {'type': 'long', 'role': SessionRole.KEY_LONG, 'description': 'Dress rehearsal', 'duration': 90, 'sport': 'bike', 'purpose': 'Full race simulation'},
            {'type': 'brick', 'role': SessionRole.BRICK, 'description': 'Brick run off bike', 'duration': 30, 'sport': 'run', 'purpose': 'Transition practice'},
        ]
    
    def _taper_week_template(self, is_recovery: bool) -> List[Optional[Dict]]:
        """Template for taper weeks."""
        return [
            {'type': 'rest', 'role': SessionRole.REST, 'description': 'Rest', 'duration': 0},
            {'type': 'easy', 'role': SessionRole.SUPPORT, 'description': 'Easy spin', 'duration': 40, 'sport': 'bike'},
            {'type': 'opener', 'role': SessionRole.KEY_INTENSITY, 'description': 'Openers - short sharp efforts', 'duration': 35, 'sport': 'run', 'purpose': 'Neuromuscular activation'},
            {'type': 'rest', 'role': SessionRole.REST, 'description': 'Rest', 'duration': 0},
            {'type': 'easy', 'role': SessionRole.RECOVERY, 'description': 'Shakeout', 'duration': 20, 'sport': 'bike'},
            {'type': 'rest', 'role': SessionRole.REST, 'description': 'Rest or travel', 'duration': 0},
            {'type': 'race', 'role': SessionRole.RACE, 'description': 'RACE DAY', 'duration': 0, 'purpose': 'Execute!'},
        ]


class PlanExecutionTracker:
    """
    Tracks execution of the training plan and compares planned vs actual.
    """
    
    def __init__(self, plan: Macrocycle):
        self.plan = plan
        
    def log_workout(self, workout: WorkoutEvaluation) -> Tuple[Optional[PlannedSession], ComplianceStatus]:
        """
        Match an executed workout to a planned session and update compliance.
        
        Returns the matched session and compliance status.
        """
        current_week = self.plan.get_current_week()
        if not current_week:
            return None, ComplianceStatus.MISSED
            
        # Find best matching session
        best_match = None
        best_score = 0.0
        
        for session in current_week.sessions:
            if session.executed:
                continue
            is_match, score = session.matches_workout(workout)
            if is_match and score > best_score:
                best_match = session
                best_score = score
                
        if best_match:
            best_match.executed = True
            best_match.execution_date = workout.workout_date
            best_match.actual_workout = workout
            best_match.compliance = best_match.evaluate_compliance(workout)
            return best_match, best_match.compliance
            
        return None, ComplianceStatus.SWAPPED
    
    def get_week_summary(self, week_num: Optional[int] = None) -> Dict[str, Any]:
        """Get detailed summary of a week's execution."""
        week = self.plan.get_week(week_num) if week_num else self.plan.get_current_week()
        if not week:
            return {}
            
        summary = week.summary()
        
        # Add session-level detail
        summary['sessions'] = []
        for session in week.sessions:
            session_summary = {
                'id': session.id,
                'day': session.date.strftime('%A'),
                'type': session.session_type,
                'role': session.role.value,
                'is_key': session.is_key_session,
                'planned_duration': session.duration_minutes,
                'executed': session.executed,
                'compliance': session.compliance.value if session.executed else 'pending',
            }
            
            if session.executed and session.actual_workout:
                session_summary['actual_duration'] = session.actual_workout.duration_seconds // 60
                session_summary['actual_np'] = session.actual_workout.normalized_power
                
            summary['sessions'].append(session_summary)
            
        return summary
    
    def get_compliance_report(self) -> Dict[str, Any]:
        """Generate overall compliance report."""
        total_key_sessions = 0
        completed_key_sessions = 0
        total_sessions = 0
        completed_sessions = 0
        
        by_week = []
        
        for meso in self.plan.mesocycles:
            for micro in meso.microcycles:
                week_key = 0
                week_key_done = 0
                week_total = 0
                week_done = 0
                
                for session in micro.sessions:
                    if session.role != SessionRole.REST:
                        total_sessions += 1
                        week_total += 1
                        if session.executed:
                            completed_sessions += 1
                            week_done += 1
                            
                    if session.is_key_session:
                        total_key_sessions += 1
                        week_key += 1
                        if session.executed and session.compliance in [
                            ComplianceStatus.NAILED, ComplianceStatus.COMPLETED
                        ]:
                            completed_key_sessions += 1
                            week_key_done += 1
                            
                by_week.append({
                    'week': micro.week_number,
                    'key_compliance': week_key_done / week_key if week_key > 0 else 1.0,
                    'total_compliance': week_done / week_total if week_total > 0 else 1.0,
                })
                
        return {
            'overall': {
                'key_sessions': {
                    'completed': completed_key_sessions,
                    'total': total_key_sessions,
                    'rate': completed_key_sessions / total_key_sessions if total_key_sessions > 0 else 0,
                },
                'all_sessions': {
                    'completed': completed_sessions,
                    'total': total_sessions,
                    'rate': completed_sessions / total_sessions if total_sessions > 0 else 0,
                },
            },
            'by_week': by_week,
        }
    
    def what_matters_today(self) -> Dict[str, Any]:
        """
        Get today's session with full context about why it matters.
        
        This is the key "contextualization" function.
        """
        current_week = self.plan.get_current_week()
        current_meso = self.plan.get_current_mesocycle()
        
        if not current_week or not current_meso:
            return {'message': 'No active plan'}
            
        today = datetime.now().weekday()
        today_sessions = current_week.get_session_by_day(today)
        
        # Get week context
        key_sessions_this_week = current_week.get_key_sessions()
        completed_key = [s for s in key_sessions_this_week if s.executed and s.compliance in [
            ComplianceStatus.NAILED, ComplianceStatus.COMPLETED
        ]]
        remaining_key = [s for s in key_sessions_this_week if not s.executed]
        
        result = {
            'date': datetime.now().strftime('%A, %B %d'),
            'week_number': current_week.week_number,
            'block': {
                'name': current_meso.name,
                'type': current_meso.block_type.value,
                'primary_adaptation': current_meso.primary_adaptation.value if current_meso.primary_adaptation else None,
            },
            'week_context': {
                'is_recovery_week': current_week.is_recovery_week,
                'key_sessions_total': len(key_sessions_this_week),
                'key_sessions_done': len(completed_key),
                'key_sessions_remaining': len(remaining_key),
            },
            'today': [],
            'why_it_matters': '',
            'this_week_priorities': [],
        }
        
        # Today's sessions
        for session in today_sessions:
            session_info = {
                'type': session.session_type,
                'description': session.description,
                'duration': session.duration_minutes,
                'role': session.role.value,
                'is_key': session.is_key_session,
                'purpose': session.purpose,
                'targets': {},
            }
            
            if session.target_power_low:
                session_info['targets']['power'] = f"{session.target_power_low}-{session.target_power_high}W"
            if session.target_zone:
                session_info['targets']['zone'] = f"Z{session.target_zone}"
                
            result['today'].append(session_info)
            
        # Why it matters
        if today_sessions:
            session = today_sessions[0]
            if session.is_key_session:
                result['why_it_matters'] = (
                    f"This is a KEY SESSION. {session.purpose or 'Critical for your adaptation this block.'} "
                    f"You have {len(remaining_key)} key sessions remaining this week."
                )
            elif session.role == SessionRole.RECOVERY:
                next_key = next((s for s in remaining_key if s.date > session.date), None)
                if next_key:
                    result['why_it_matters'] = (
                        f"Recovery day to prepare for {next_key.description} on {next_key.date.strftime('%A')}. "
                        f"Don't skip - the quality of your next key session depends on today's recovery."
                    )
                else:
                    result['why_it_matters'] = "Active recovery to absorb this week's training load."
            elif session.role == SessionRole.REST:
                result['why_it_matters'] = "Complete rest. Your body adapts during rest, not during training."
            else:
                result['why_it_matters'] = (
                    f"Support session for the week's key work. {session.purpose or ''}"
                )
        else:
            result['why_it_matters'] = "Rest day - recovery is part of the plan."
            
        # Week priorities
        for session in key_sessions_this_week:
            status = "âœ“" if session.executed else "â—‹"
            result['this_week_priorities'].append({
                'status': status,
                'day': session.date.strftime('%A'),
                'description': session.description,
                'purpose': session.purpose,
            })
            
        return result
    
    def how_does_this_fit(self, workout: WorkoutEvaluation) -> Dict[str, Any]:
        """
        Explain how a completed workout fits into the larger plan.
        
        Called after workout evaluation to provide context.
        """
        matched_session, compliance = self.log_workout(workout)
        current_week = self.plan.get_current_week()
        current_meso = self.plan.get_current_mesocycle()
        
        result = {
            'workout_summary': {
                'sport': workout.sport,
                'duration': workout.duration_seconds // 60,
                'type': workout.workout_type,
                'np': workout.normalized_power,
                'if': workout.intensity_factor,
            },
            'plan_match': {},
            'compliance': compliance.value,
            'impact_on_week': {},
            'impact_on_block': {},
            'recommendations': [],
        }
        
        if matched_session:
            result['plan_match'] = {
                'matched': True,
                'session_id': matched_session.id,
                'planned_description': matched_session.description,
                'planned_duration': matched_session.duration_minutes,
                'role': matched_session.role.value,
                'was_key_session': matched_session.is_key_session,
            }
            
            # Compliance analysis
            if compliance == ComplianceStatus.NAILED:
                result['compliance_detail'] = "Perfect execution - hit all targets"
            elif compliance == ComplianceStatus.COMPLETED:
                result['compliance_detail'] = "Session completed with minor variance"
            elif compliance == ComplianceStatus.EXCEEDED:
                result['compliance_detail'] = "Exceeded prescription - watch for excess fatigue"
                result['recommendations'].append("Consider easier tomorrow to balance load")
            elif compliance == ComplianceStatus.PARTIAL:
                result['compliance_detail'] = "Partial completion - that's okay, something beats nothing"
            elif compliance == ComplianceStatus.MODIFIED:
                result['compliance_detail'] = "Significant modification from plan"
        else:
            result['plan_match'] = {
                'matched': False,
                'note': 'This workout was not in today\'s plan - logged as extra session',
            }
            
        # Impact on week
        if current_week:
            key_sessions = current_week.get_key_sessions()
            done = sum(1 for s in key_sessions if s.executed and s.compliance in [
                ComplianceStatus.NAILED, ComplianceStatus.COMPLETED
            ])
            result['impact_on_week'] = {
                'key_sessions_completed': f"{done}/{len(key_sessions)}",
                'compliance_rate': f"{(done / len(key_sessions) * 100):.0f}%" if key_sessions else "N/A",
            }
            
            remaining_key = [s for s in key_sessions if not s.executed]
            if remaining_key:
                next_key = remaining_key[0]
                result['impact_on_week']['next_key_session'] = {
                    'day': next_key.date.strftime('%A'),
                    'description': next_key.description,
                }
                
        # Impact on block
        if current_meso:
            result['impact_on_block'] = {
                'block_name': current_meso.name,
                'adaptation_focus': current_meso.primary_adaptation.value if current_meso.primary_adaptation else None,
                'weeks_in_block': f"{self.plan.current_week - current_meso.microcycles[0].week_number + 1}/{current_meso.weeks}",
            }
            
            if workout.breakthrough:
                result['impact_on_block']['breakthrough'] = True
                result['recommendations'].append(
                    "Breakthrough detected! Consider updating FTP/threshold targets."
                )
                
        return result


def generate_plan_visualization(plan: Macrocycle) -> str:
    """Generate ASCII visualization of the training plan."""
    lines = []
    
    lines.append("=" * 80)
    lines.append(f"  ðŸ“‹ TRAINING PLAN: {plan.name}")
    lines.append("=" * 80)
    lines.append("")
    lines.append(f"  ðŸŽ¯ Goal: {plan.goal.race_name}")
    lines.append(f"  ðŸ“… Race Date: {plan.goal.race_date.strftime('%B %d, %Y')}")
    lines.append(f"  ðŸ“Š Total Weeks: {plan.total_weeks}")
    lines.append(f"  ðŸ“ Current Week: {plan.current_week}")
    lines.append("")
    
    # Block overview
    lines.append("  â”€â”€â”€ PERIODIZATION BLOCKS â”€â”€â”€")
    lines.append("")
    
    for meso in plan.mesocycles:
        block_icon = {
            BlockType.BASE_AEROBIC: "ðŸƒ",
            BlockType.BASE_STRENGTH: "ðŸ’ª",
            BlockType.BUILD_THRESHOLD: "âš¡",
            BlockType.BUILD_VO2MAX: "ðŸ”¥",
            BlockType.PEAK_SPECIFIC: "ðŸŽ¯",
            BlockType.TAPER: "ðŸŒ™",
            BlockType.RACE: "ðŸ",
            BlockType.RECOVERY: "ðŸ˜´",
        }.get(meso.block_type, "ðŸ“¦")
        
        week_range = f"Weeks {meso.microcycles[0].week_number}-{meso.microcycles[-1].week_number}" if meso.microcycles else ""
        
        # Progress bar
        total_weeks = len(meso.microcycles)
        completed_weeks = sum(1 for m in meso.microcycles if m.week_number < plan.current_week)
        bar_width = 20
        filled = int(bar_width * completed_weeks / total_weeks) if total_weeks > 0 else 0
        bar = "â–ˆ" * filled + "â–‘" * (bar_width - filled)
        
        lines.append(f"  {block_icon} {meso.name}")
        lines.append(f"     {week_range} | [{bar}]")
        lines.append(f"     Focus: {meso.primary_adaptation.value if meso.primary_adaptation else 'General'}")
        lines.append(f"     Hours: {meso.weekly_hours_start:.0f}-{meso.weekly_hours_peak:.0f}/week")
        lines.append("")
        
    # Current week detail
    current_week = plan.get_current_week()
    if current_week:
        lines.append("  â”€â”€â”€ THIS WEEK â”€â”€â”€")
        lines.append("")
        lines.append(f"  Week {current_week.week_number} | {current_week.block_type.value.upper()}")
        if current_week.is_recovery_week:
            lines.append("  âš ï¸  RECOVERY WEEK - Reduced load")
        lines.append("")
        
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        for i, day in enumerate(days):
            sessions = current_week.get_session_by_day(i)
            if sessions:
                for session in sessions:
                    marker = "â­" if session.is_key_session else "  "
                    status = "âœ“" if session.executed else "â—‹"
                    lines.append(f"  {marker} {day}: {status} {session.description} ({session.duration_minutes}min)")
            else:
                lines.append(f"     {day}: REST")
                
        lines.append("")
        lines.append(f"  Planned hours: {current_week.planned_hours:.1f}")
        
    lines.append("")
    lines.append("=" * 80)
    
    return "\n".join(lines)
