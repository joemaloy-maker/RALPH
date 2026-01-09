"""
Dynamic Plan Adjustment Engine
==============================
Automatically adjusts training plans based on:
- Workout evaluation results
- Recovery metrics
- Goal progress
- Time remaining

This module implements the "feedback loop" that makes the system adaptive.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import List, Dict, Any, Optional, Callable
import json

from .auto_evaluator import (
    AutoEvaluator,
    WorkoutEvaluation,
    TrainingPhase,
    AdaptationSignal,
    DailyAction,
    CurrentState,
    GoalState,
    GapAnalysis,
)


class AdjustmentTrigger(Enum):
    """Events that trigger plan adjustments."""
    BREAKTHROUGH = "breakthrough"           # New fitness level detected
    OVERREACHING = "overreaching"           # TSB < -30
    POOR_RECOVERY = "poor_recovery"         # Recovery score < 34
    MISSED_SESSION = "missed_session"       # Planned workout not completed
    DECOUPLING_HIGH = "decoupling_high"     # Aerobic inefficiency
    GOAL_OFF_TRACK = "goal_off_track"       # Progress not matching trajectory
    PHASE_TRANSITION = "phase_transition"   # Moving to new training phase
    INJURY_RISK = "injury_risk"             # ACWR > 1.5 or other flags


class AdjustmentType(Enum):
    """Types of plan adjustments."""
    VOLUME_INCREASE = "volume_increase"
    VOLUME_DECREASE = "volume_decrease"
    INTENSITY_INCREASE = "intensity_increase"
    INTENSITY_DECREASE = "intensity_decrease"
    ADD_RECOVERY = "add_recovery"
    UPDATE_ZONES = "update_zones"
    SHIFT_FOCUS = "shift_focus"
    RESCHEDULE_KEY = "reschedule_key"


@dataclass
class PlanAdjustment:
    """Represents a single adjustment to the training plan."""
    trigger: AdjustmentTrigger
    adjustment_type: AdjustmentType
    description: str
    magnitude: float  # % change or absolute value
    
    # Scope
    affects_days: int = 7  # How many days this affects
    sport: Optional[str] = None  # "run", "bike", "swim", or None for all
    
    # Implementation details
    specific_changes: Dict[str, Any] = field(default_factory=dict)
    reasoning: str = ""
    
    # Priority for conflicting adjustments
    priority: int = 5  # 1-10, higher = more important


@dataclass
class TrainingWeek:
    """Represents a week of training with planned sessions."""
    week_number: int
    start_date: datetime
    phase: TrainingPhase
    
    planned_volume_hours: float
    planned_tss: float
    planned_intensity_distribution: Dict[str, float]  # Zone -> hours
    
    sessions: List[DailyAction]
    adjustments_applied: List[PlanAdjustment] = field(default_factory=list)
    
    def total_duration_minutes(self) -> int:
        return sum(s.duration_minutes for s in self.sessions)


class DynamicPlanEngine:
    """
    Core engine for dynamic plan adjustment.
    
    This engine:
    1. Monitors incoming workout evaluations
    2. Detects triggers that require adjustment
    3. Generates appropriate adjustments
    4. Applies adjustments to upcoming training
    5. Tracks adjustment history for learning
    """
    
    def __init__(self, evaluator: AutoEvaluator):
        self.evaluator = evaluator
        self.adjustment_history: List[PlanAdjustment] = []
        self.pending_adjustments: List[PlanAdjustment] = []
        self.rules: List[Callable] = self._initialize_rules()
        
    def _initialize_rules(self) -> List[Callable]:
        """Initialize the rule set for triggering adjustments."""
        return [
            self._rule_breakthrough,
            self._rule_overreaching,
            self._rule_poor_recovery,
            self._rule_decoupling,
            self._rule_goal_trajectory,
            self._rule_phase_transition,
            self._rule_injury_risk,
            self._rule_intensity_distribution,
        ]
    
    def process_workout(self, evaluation: WorkoutEvaluation) -> List[PlanAdjustment]:
        """
        Process a new workout evaluation and generate any needed adjustments.
        
        This is the main entry point called after each workout file is evaluated.
        """
        adjustments = []
        
        # Run all rules
        for rule in self.rules:
            rule_adjustments = rule(evaluation)
            adjustments.extend(rule_adjustments)
            
        # Prioritize and resolve conflicts
        adjustments = self._resolve_conflicts(adjustments)
        
        # Store adjustments
        self.pending_adjustments.extend(adjustments)
        self.adjustment_history.extend(adjustments)
        
        return adjustments
    
    def _rule_breakthrough(self, evaluation: WorkoutEvaluation) -> List[PlanAdjustment]:
        """Detect breakthrough and update training zones."""
        adjustments = []
        
        if evaluation.breakthrough:
            new_ftp = evaluation.normalized_power * 0.95 if evaluation.normalized_power else None
            
            if new_ftp and new_ftp > self.evaluator.current.current_ftp:
                adjustments.append(PlanAdjustment(
                    trigger=AdjustmentTrigger.BREAKTHROUGH,
                    adjustment_type=AdjustmentType.UPDATE_ZONES,
                    description=f"Update FTP from {self.evaluator.current.current_ftp:.0f}W to {new_ftp:.0f}W",
                    magnitude=new_ftp,
                    specific_changes={
                        'old_ftp': self.evaluator.current.current_ftp,
                        'new_ftp': new_ftp,
                        'zones': self._calculate_new_zones(new_ftp),
                    },
                    reasoning="Breakthrough workout detected - fitness has increased",
                    priority=9,
                ))
                
                # Also consider slight intensity increase
                adjustments.append(PlanAdjustment(
                    trigger=AdjustmentTrigger.BREAKTHROUGH,
                    adjustment_type=AdjustmentType.INTENSITY_INCREASE,
                    description="Increase intensity targets for next week",
                    magnitude=5,  # 5% increase
                    affects_days=7,
                    reasoning="Capitalize on fitness gains while fresh",
                    priority=6,
                ))
                
        return adjustments
    
    def _rule_overreaching(self, evaluation: WorkoutEvaluation) -> List[PlanAdjustment]:
        """Detect overreaching and prescribe recovery."""
        adjustments = []
        
        current = self.evaluator.current
        
        if current.tsb < -30:
            adjustments.append(PlanAdjustment(
                trigger=AdjustmentTrigger.OVERREACHING,
                adjustment_type=AdjustmentType.VOLUME_DECREASE,
                description="Reduce volume by 30% for recovery",
                magnitude=-30,
                affects_days=7,
                reasoning=f"TSB = {current.tsb:.0f}, indicating significant overreaching",
                priority=10,  # Highest priority - injury prevention
            ))
            
            adjustments.append(PlanAdjustment(
                trigger=AdjustmentTrigger.OVERREACHING,
                adjustment_type=AdjustmentType.ADD_RECOVERY,
                description="Add 2 recovery days this week",
                magnitude=2,
                affects_days=7,
                specific_changes={'recovery_days_to_add': 2},
                reasoning="Need recovery before continuing training",
                priority=10,
            ))
            
        elif current.tsb < -15:
            adjustments.append(PlanAdjustment(
                trigger=AdjustmentTrigger.OVERREACHING,
                adjustment_type=AdjustmentType.INTENSITY_DECREASE,
                description="Reduce intensity by 10%",
                magnitude=-10,
                affects_days=4,
                reasoning=f"TSB = {current.tsb:.0f}, moderate fatigue accumulating",
                priority=7,
            ))
            
        return adjustments
    
    def _rule_poor_recovery(self, evaluation: WorkoutEvaluation) -> List[PlanAdjustment]:
        """React to poor recovery scores."""
        adjustments = []
        
        recovery = self.evaluator.current.recovery_score
        
        if recovery < 34:  # Red zone
            adjustments.append(PlanAdjustment(
                trigger=AdjustmentTrigger.POOR_RECOVERY,
                adjustment_type=AdjustmentType.ADD_RECOVERY,
                description="Convert today's session to recovery or rest",
                magnitude=1,
                affects_days=1,
                reasoning=f"Recovery score {recovery}% indicates need for rest",
                priority=9,
            ))
            
        elif recovery < 67:  # Yellow zone
            adjustments.append(PlanAdjustment(
                trigger=AdjustmentTrigger.POOR_RECOVERY,
                adjustment_type=AdjustmentType.INTENSITY_DECREASE,
                description="Reduce today's intensity by 10%",
                magnitude=-10,
                affects_days=1,
                reasoning=f"Recovery score {recovery}% suggests lower intensity",
                priority=6,
            ))
            
        return adjustments
    
    def _rule_decoupling(self, evaluation: WorkoutEvaluation) -> List[PlanAdjustment]:
        """React to high aerobic decoupling."""
        adjustments = []
        
        # Check trend over last 5 endurance sessions
        recent_endurance = [
            e for e in self.evaluator.history[-10:]
            if e.workout_type in ['easy', 'endurance', 'long']
        ][-5:]
        
        if recent_endurance:
            avg_decoupling = sum(e.decoupling_pct for e in recent_endurance) / len(recent_endurance)
            
            if avg_decoupling > 8:
                adjustments.append(PlanAdjustment(
                    trigger=AdjustmentTrigger.DECOUPLING_HIGH,
                    adjustment_type=AdjustmentType.SHIFT_FOCUS,
                    description="Add more Zone 2 volume, reduce intensity sessions",
                    magnitude=0,
                    affects_days=14,
                    specific_changes={
                        'add_z2_hours': 2,
                        'reduce_intensity_sessions': 1,
                    },
                    reasoning=f"Average decoupling {avg_decoupling:.1f}% indicates aerobic base needs work",
                    priority=5,
                ))
                
        return adjustments
    
    def _rule_goal_trajectory(self, evaluation: WorkoutEvaluation) -> List[PlanAdjustment]:
        """Check if progress is on track for goal."""
        adjustments = []
        
        gap = self.evaluator.gap
        
        # Calculate expected progress vs actual
        weeks_elapsed = 4  # Would track from start
        expected_ftp_gain = gap.ftp_gap * (weeks_elapsed / gap.weeks_available) if gap.weeks_available > 0 else 0
        actual_ftp_gain = self.evaluator.current.current_ftp - (self.evaluator.goal.target_ftp - gap.ftp_gap)
        
        # If significantly behind trajectory
        if expected_ftp_gain > 0 and actual_ftp_gain < expected_ftp_gain * 0.5:
            adjustments.append(PlanAdjustment(
                trigger=AdjustmentTrigger.GOAL_OFF_TRACK,
                adjustment_type=AdjustmentType.INTENSITY_INCREASE,
                description="Increase quality sessions to accelerate adaptation",
                magnitude=10,
                affects_days=14,
                reasoning="Progress behind target trajectory - need to accelerate",
                priority=4,
            ))
            
        return adjustments
    
    def _rule_phase_transition(self, evaluation: WorkoutEvaluation) -> List[PlanAdjustment]:
        """Handle training phase transitions."""
        adjustments = []
        
        phase = self.evaluator.goal.current_phase()
        days = self.evaluator.goal.days_remaining()
        
        # Check for phase boundaries
        phase_boundaries = [
            (84, TrainingPhase.BASE, TrainingPhase.BUILD),
            (42, TrainingPhase.BUILD, TrainingPhase.PEAK),
            (14, TrainingPhase.PEAK, TrainingPhase.TAPER),
        ]
        
        for boundary_days, from_phase, to_phase in phase_boundaries:
            if days == boundary_days:
                adjustments.append(PlanAdjustment(
                    trigger=AdjustmentTrigger.PHASE_TRANSITION,
                    adjustment_type=AdjustmentType.SHIFT_FOCUS,
                    description=f"Transition from {from_phase.value} to {to_phase.value}",
                    magnitude=0,
                    affects_days=7,
                    specific_changes={
                        'from_phase': from_phase.value,
                        'to_phase': to_phase.value,
                        'new_priorities': self._get_phase_priorities(to_phase),
                    },
                    reasoning=f"{days} days to race - entering {to_phase.value} phase",
                    priority=8,
                ))
                
        return adjustments
    
    def _rule_injury_risk(self, evaluation: WorkoutEvaluation) -> List[PlanAdjustment]:
        """Detect injury risk patterns."""
        adjustments = []
        
        # Calculate ACWR (Acute:Chronic Workload Ratio)
        current = self.evaluator.current
        if current.ctl > 0:
            acwr = current.atl / current.ctl
            
            if acwr > 1.5:
                adjustments.append(PlanAdjustment(
                    trigger=AdjustmentTrigger.INJURY_RISK,
                    adjustment_type=AdjustmentType.VOLUME_DECREASE,
                    description="Reduce volume - injury risk elevated",
                    magnitude=-25,
                    affects_days=7,
                    reasoning=f"ACWR = {acwr:.2f} (>1.5 = injury risk). Reduce load immediately.",
                    priority=10,
                ))
                
            elif acwr > 1.3:
                adjustments.append(PlanAdjustment(
                    trigger=AdjustmentTrigger.INJURY_RISK,
                    adjustment_type=AdjustmentType.VOLUME_DECREASE,
                    description="Moderate volume reduction for safety",
                    magnitude=-15,
                    affects_days=7,
                    reasoning=f"ACWR = {acwr:.2f} (1.3-1.5 = elevated risk). Moderate reduction advised.",
                    priority=7,
                ))
                
        return adjustments
    
    def _rule_intensity_distribution(self, evaluation: WorkoutEvaluation) -> List[PlanAdjustment]:
        """Check polarized training distribution."""
        adjustments = []
        
        # Analyze last 4 weeks of training
        recent = self.evaluator.history[-28:]
        
        if len(recent) >= 7:
            # Calculate zone distribution
            z1_z2_time = sum(
                e.duration_seconds * (e.zone_distribution.get(1, 0) + e.zone_distribution.get(2, 0)) / 100
                for e in recent
            )
            z3_time = sum(
                e.duration_seconds * e.zone_distribution.get(3, 0) / 100
                for e in recent
            )
            z4_z5_time = sum(
                e.duration_seconds * (e.zone_distribution.get(4, 0) + e.zone_distribution.get(5, 0)) / 100
                for e in recent
            )
            
            total_time = z1_z2_time + z3_time + z4_z5_time
            
            if total_time > 0:
                z3_pct = (z3_time / total_time) * 100
                
                # Too much Zone 3 = "black hole" training
                if z3_pct > 20:
                    adjustments.append(PlanAdjustment(
                        trigger=AdjustmentTrigger.GOAL_OFF_TRACK,
                        adjustment_type=AdjustmentType.SHIFT_FOCUS,
                        description="Too much Zone 3 - polarize training more",
                        magnitude=0,
                        affects_days=14,
                        specific_changes={
                            'reduce_z3_sessions': True,
                            'add_easy_volume': True,
                            'sharpen_intervals': True,
                        },
                        reasoning=f"Zone 3 at {z3_pct:.0f}% (target <15%). Training in 'black hole' - go easier or harder.",
                        priority=5,
                    ))
                    
        return adjustments
    
    def _calculate_new_zones(self, ftp: float) -> Dict[str, Dict[str, int]]:
        """Calculate new power zones based on FTP."""
        return {
            'Z1_Recovery': {'min': 0, 'max': int(ftp * 0.55)},
            'Z2_Endurance': {'min': int(ftp * 0.55), 'max': int(ftp * 0.75)},
            'Z3_Tempo': {'min': int(ftp * 0.75), 'max': int(ftp * 0.90)},
            'Z4_Threshold': {'min': int(ftp * 0.90), 'max': int(ftp * 1.05)},
            'Z5_VO2max': {'min': int(ftp * 1.05), 'max': int(ftp * 1.20)},
            'Z6_Anaerobic': {'min': int(ftp * 1.20), 'max': 9999},
        }
    
    def _get_phase_priorities(self, phase: TrainingPhase) -> Dict[str, int]:
        """Get priority scores for different training types in each phase."""
        priorities = {
            TrainingPhase.BASE: {
                'volume': 10, 'z2_endurance': 10, 'long_sessions': 9,
                'tempo': 4, 'threshold': 3, 'vo2max': 2,
            },
            TrainingPhase.BUILD: {
                'volume': 7, 'z2_endurance': 6, 'long_sessions': 7,
                'tempo': 8, 'threshold': 9, 'vo2max': 7,
            },
            TrainingPhase.PEAK: {
                'volume': 5, 'z2_endurance': 5, 'long_sessions': 6,
                'tempo': 6, 'threshold': 8, 'vo2max': 9, 'race_specific': 10,
            },
            TrainingPhase.TAPER: {
                'volume': 2, 'z2_endurance': 4, 'long_sessions': 2,
                'tempo': 3, 'threshold': 4, 'vo2max': 3, 'openers': 8, 'rest': 10,
            },
        }
        return priorities.get(phase, priorities[TrainingPhase.BASE])
    
    def _resolve_conflicts(self, adjustments: List[PlanAdjustment]) -> List[PlanAdjustment]:
        """Resolve conflicting adjustments by priority."""
        if not adjustments:
            return []
            
        # Group by adjustment type
        by_type = {}
        for adj in adjustments:
            key = adj.adjustment_type
            if key not in by_type:
                by_type[key] = []
            by_type[key].append(adj)
            
        # Keep highest priority in each group
        resolved = []
        for adj_type, adj_list in by_type.items():
            adj_list.sort(key=lambda x: x.priority, reverse=True)
            resolved.append(adj_list[0])
            
        return resolved
    
    def apply_adjustments_to_week(self, week: TrainingWeek) -> TrainingWeek:
        """Apply pending adjustments to a training week."""
        for adjustment in self.pending_adjustments:
            if adjustment.affects_days >= 7 or adjustment.affects_days == 0:
                week = self._apply_single_adjustment(week, adjustment)
                week.adjustments_applied.append(adjustment)
                
        # Clear processed adjustments
        self.pending_adjustments = [
            a for a in self.pending_adjustments
            if a.affects_days > 7
        ]
        
        return week
    
    def _apply_single_adjustment(self, week: TrainingWeek, adj: PlanAdjustment) -> TrainingWeek:
        """Apply a single adjustment to the week."""
        
        if adj.adjustment_type == AdjustmentType.VOLUME_DECREASE:
            factor = 1 + (adj.magnitude / 100)  # magnitude is negative
            week.planned_volume_hours *= factor
            week.planned_tss *= factor
            for session in week.sessions:
                session.duration_minutes = int(session.duration_minutes * factor)
                
        elif adj.adjustment_type == AdjustmentType.VOLUME_INCREASE:
            factor = 1 + (adj.magnitude / 100)
            week.planned_volume_hours *= factor
            # Don't increase individual sessions, add volume via easy sessions
            
        elif adj.adjustment_type == AdjustmentType.INTENSITY_DECREASE:
            # Reduce intensity targets in quality sessions
            for session in week.sessions:
                if session.action_type in ['threshold', 'vo2max', 'race_specific']:
                    if session.success_threshold:
                        session.success_threshold *= (1 + adj.magnitude / 100)
                        
        elif adj.adjustment_type == AdjustmentType.ADD_RECOVERY:
            # Convert some sessions to recovery
            days_to_convert = int(adj.magnitude)
            quality_sessions = [s for s in week.sessions if s.priority >= 4]
            for session in quality_sessions[:days_to_convert]:
                session.action_type = 'recovery'
                session.description = 'Recovery - adjusted from quality session'
                session.duration_minutes = 30
                session.priority = 2
                
        elif adj.adjustment_type == AdjustmentType.SHIFT_FOCUS:
            # Modify session types based on specific_changes
            changes = adj.specific_changes
            if changes.get('add_z2_hours'):
                # Find lowest priority sessions and extend
                easy_sessions = [s for s in week.sessions if s.action_type in ['easy', 'endurance']]
                for session in easy_sessions[:2]:
                    session.duration_minutes += 30
                    
        return week
    
    def get_adjustment_summary(self) -> Dict[str, Any]:
        """Get summary of recent adjustments."""
        recent = self.adjustment_history[-10:]
        
        return {
            'total_adjustments': len(self.adjustment_history),
            'pending': len(self.pending_adjustments),
            'recent': [
                {
                    'trigger': a.trigger.value,
                    'type': a.adjustment_type.value,
                    'description': a.description,
                    'reasoning': a.reasoning,
                }
                for a in recent
            ],
            'by_trigger': self._count_by_trigger(),
            'by_type': self._count_by_type(),
        }
    
    def _count_by_trigger(self) -> Dict[str, int]:
        counts = {}
        for a in self.adjustment_history:
            key = a.trigger.value
            counts[key] = counts.get(key, 0) + 1
        return counts
    
    def _count_by_type(self) -> Dict[str, int]:
        counts = {}
        for a in self.adjustment_history:
            key = a.adjustment_type.value
            counts[key] = counts.get(key, 0) + 1
        return counts
    
    def to_json(self) -> str:
        """Export adjustment engine state."""
        return json.dumps(self.get_adjustment_summary(), indent=2)


# Integration function
def create_adaptive_system(
    race_name: str,
    race_date: str,
    current_ftp: float = 200,
    current_threshold_pace: float = 390,  # 6:30/mi
) -> tuple[AutoEvaluator, DynamicPlanEngine]:
    """
    Create an integrated adaptive training system.
    
    Returns both the evaluator and plan engine, ready to process workouts.
    """
    from .auto_evaluator import create_evaluator
    
    evaluator = create_evaluator(
        race_name=race_name,
        race_date=race_date,
        current_ftp=current_ftp,
        current_threshold_pace=current_threshold_pace,
    )
    
    plan_engine = DynamicPlanEngine(evaluator)
    
    return evaluator, plan_engine
