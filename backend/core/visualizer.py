"""
Progress Visualization Module
=============================
Generates visual representations of daily actions toward long-term goals.

Provides:
- Gap closure charts
- Daily action tracking
- Phase timeline
- Load/recovery balance
"""

import json
from dataclasses import asdict
from datetime import datetime, timedelta
from typing import List, Dict, Any

from .auto_evaluator import (
    AutoEvaluator, 
    DailyAction, 
    TrainingPhase,
    GoalState,
    CurrentState,
    GapAnalysis
)


class ProgressVisualizer:
    """
    Generates visualization data for athlete progress dashboards.
    """
    
    def __init__(self, evaluator: AutoEvaluator):
        self.evaluator = evaluator
        
    def generate_gap_closure_data(self) -> Dict[str, Any]:
        """
        Generate data showing how gaps close over time.
        
        Returns data suitable for line charts showing:
        - Current value trending toward target
        - Projected trajectory vs ideal trajectory
        """
        gap = self.evaluator.gap
        goal = self.evaluator.goal
        current = self.evaluator.current
        
        weeks_remaining = gap.weeks_available
        
        # Generate weekly projections
        ftp_projection = []
        pace_projection = []
        
        # Realistic weekly gains
        ftp_weekly_gain = 2.0  # ~1% per week
        pace_weekly_gain = 3.0  # ~3 sec/mile per week
        
        for week in range(weeks_remaining + 1):
            # FTP projection
            projected_ftp = current.current_ftp + (ftp_weekly_gain * week)
            ideal_ftp = current.current_ftp + ((gap.ftp_gap / weeks_remaining) * week) if weeks_remaining > 0 else goal.target_ftp
            ftp_projection.append({
                'week': week,
                'projected': min(projected_ftp, goal.target_ftp or projected_ftp),
                'ideal': min(ideal_ftp, goal.target_ftp or ideal_ftp),
                'target': goal.target_ftp,
            })
            
            # Pace projection (lower is better)
            projected_pace = current.current_threshold_pace - (pace_weekly_gain * week)
            ideal_pace = current.current_threshold_pace - ((gap.pace_gap / weeks_remaining) * week) if weeks_remaining > 0 else goal.target_threshold_pace
            pace_projection.append({
                'week': week,
                'projected': max(projected_pace, goal.target_threshold_pace or projected_pace),
                'ideal': max(ideal_pace, goal.target_threshold_pace or ideal_pace),
                'target': goal.target_threshold_pace,
            })
            
        return {
            'ftp': {
                'current': current.current_ftp,
                'target': goal.target_ftp,
                'gap': gap.ftp_gap,
                'gap_pct': gap.ftp_gap_pct,
                'achievable': gap.ftp_achievable,
                'projection': ftp_projection,
            },
            'pace': {
                'current': current.current_threshold_pace,
                'target': goal.target_threshold_pace,
                'gap': gap.pace_gap,
                'gap_pct': gap.pace_gap_pct,
                'achievable': gap.pace_achievable,
                'projection': pace_projection,
            },
        }
    
    def generate_daily_action_calendar(self, days: int = 28) -> List[Dict[str, Any]]:
        """
        Generate calendar data for daily actions.
        
        Returns list of days with:
        - Date
        - Scheduled action
        - Priority level
        - Completion status (for past days)
        """
        actions = self.evaluator.get_daily_actions(days=days)
        
        calendar = []
        for action in actions:
            calendar.append({
                'date': action.date.isoformat(),
                'day_of_week': action.date.strftime('%A'),
                'action_type': action.action_type,
                'description': action.description,
                'duration_minutes': action.duration_minutes,
                'priority': action.priority,
                'priority_label': self._priority_label(action.priority),
                'target_metric': action.target_metric,
                'success_criteria': f"{action.success_metric} {action.success_comparator} {action.success_threshold}",
                'if_recovery_yellow': action.if_recovery_yellow,
                'if_recovery_red': action.if_recovery_red,
            })
            
        return calendar
    
    def _priority_label(self, priority: int) -> str:
        labels = {
            1: "Optional",
            2: "Low",
            3: "Medium",
            4: "High",
            5: "Critical",
        }
        return labels.get(priority, "Unknown")
    
    def generate_phase_timeline(self) -> Dict[str, Any]:
        """
        Generate timeline showing training phases leading to race.
        """
        goal = self.evaluator.goal
        days_remaining = goal.days_remaining()
        race_date = goal.race_date
        
        phases = []
        
        # Calculate phase boundaries
        if days_remaining > 84:
            phases.append({
                'phase': 'BASE',
                'start': datetime.now().isoformat(),
                'end': (race_date - timedelta(days=84)).isoformat(),
                'weeks': (days_remaining - 84) // 7,
                'focus': 'Aerobic development, volume building',
                'key_sessions': ['Long Z2 rides/runs', 'Progressive long sessions'],
            })
            
        if days_remaining > 42:
            base_end = race_date - timedelta(days=84)
            phases.append({
                'phase': 'BUILD',
                'start': max(datetime.now(), base_end).isoformat(),
                'end': (race_date - timedelta(days=42)).isoformat(),
                'weeks': min(6, (min(days_remaining, 84) - 42) // 7),
                'focus': 'Threshold development, intensity',
                'key_sessions': ['Tempo intervals', 'Threshold work', 'VO2max sessions'],
            })
            
        if days_remaining > 14:
            build_end = race_date - timedelta(days=42)
            phases.append({
                'phase': 'PEAK',
                'start': max(datetime.now(), build_end).isoformat(),
                'end': (race_date - timedelta(days=14)).isoformat(),
                'weeks': min(4, (min(days_remaining, 42) - 14) // 7),
                'focus': 'Race-specific preparation, sharpening',
                'key_sessions': ['Race pace sessions', 'Dress rehearsals', 'Brick workouts'],
            })
            
        if days_remaining > 0:
            peak_end = race_date - timedelta(days=14)
            phases.append({
                'phase': 'TAPER',
                'start': max(datetime.now(), peak_end).isoformat(),
                'end': race_date.isoformat(),
                'weeks': min(2, days_remaining // 7),
                'focus': 'Recovery, freshness, confidence',
                'key_sessions': ['Openers', 'Short sharp efforts', 'Rest'],
            })
            
        phases.append({
            'phase': 'RACE',
            'start': race_date.isoformat(),
            'end': race_date.isoformat(),
            'weeks': 0,
            'focus': 'Execute!',
            'key_sessions': [goal.race_name],
        })
        
        return {
            'race_name': goal.race_name,
            'race_date': race_date.isoformat(),
            'days_remaining': days_remaining,
            'current_phase': goal.current_phase().value,
            'phases': phases,
        }
    
    def generate_load_balance_chart(self) -> Dict[str, Any]:
        """
        Generate data for CTL/ATL/TSB chart (PMC-style).
        """
        current = self.evaluator.current
        history = self.evaluator.history
        
        # Generate 6 weeks of historical + projected data
        data_points = []
        
        # Historical from workout history
        for i, workout in enumerate(history[-42:]):
            tss = workout.tss or (workout.intensity_factor ** 2 * 
                                   workout.duration_seconds / 3600 * 100)
            data_points.append({
                'date': workout.workout_date.isoformat(),
                'type': 'historical',
                'tss': tss,
                'workout_type': workout.workout_type,
            })
            
        # Current state
        data_points.append({
            'date': datetime.now().isoformat(),
            'type': 'current',
            'ctl': current.ctl,
            'atl': current.atl,
            'tsb': current.tsb,
            'form': current.form,
        })
        
        return {
            'current': {
                'ctl': current.ctl,
                'atl': current.atl,
                'tsb': current.tsb,
                'form': current.form,
            },
            'form_interpretation': self._interpret_form(current.form),
            'recommendations': self._load_recommendations(current),
            'history': data_points,
        }
    
    def _interpret_form(self, form: str) -> str:
        interpretations = {
            'FRESH': 'Well rested - ready for peak performance or key sessions',
            'RECOVERED': 'Good recovery - can handle quality training',
            'NEUTRAL': 'Balanced - normal training capacity',
            'TIRED': 'Fatigue accumulating - consider reducing intensity',
            'OVERREACHED': 'Significant fatigue - need recovery days',
        }
        return interpretations.get(form, 'Unknown state')
    
    def _load_recommendations(self, current: CurrentState) -> List[str]:
        recs = []
        
        if current.tsb < -30:
            recs.append("Add 1-2 recovery days this week")
            recs.append("Reduce planned volume by 20%")
        elif current.tsb < -10:
            recs.append("Maintain current load, ensure quality sleep")
        elif current.tsb > 25:
            recs.append("Ready for a breakthrough session")
            recs.append("Schedule key workout in next 2 days")
        elif current.tsb > 5:
            recs.append("Good time for quality intervals")
            
        return recs
    
    def generate_weekly_summary(self) -> Dict[str, Any]:
        """
        Generate weekly summary of actions and outcomes.
        """
        history = self.evaluator.history
        week_ago = datetime.now() - timedelta(days=7)
        
        weekly_workouts = [w for w in history if w.workout_date > week_ago]
        
        return {
            'period': {
                'start': week_ago.isoformat(),
                'end': datetime.now().isoformat(),
            },
            'summary': {
                'total_sessions': len(weekly_workouts),
                'total_duration_hours': sum(w.duration_seconds for w in weekly_workouts) / 3600,
                'total_tss': sum(w.tss or 0 for w in weekly_workouts),
                'breakthroughs': sum(1 for w in weekly_workouts if w.breakthrough),
                'workout_types': self._count_workout_types(weekly_workouts),
            },
            'goal_progress': {
                'ftp_change': self._calculate_ftp_change(weekly_workouts),
                'consistency_score': len(weekly_workouts) / 7.0,  # Out of 1.0
            },
            'concerns': self._aggregate_concerns(weekly_workouts),
            'wins': self._identify_wins(weekly_workouts),
        }
    
    def _count_workout_types(self, workouts) -> Dict[str, int]:
        counts = {}
        for w in workouts:
            counts[w.workout_type] = counts.get(w.workout_type, 0) + 1
        return counts
    
    def _calculate_ftp_change(self, workouts) -> float:
        # Look for breakthrough workouts that updated FTP
        breakthroughs = [w for w in workouts if w.breakthrough]
        if breakthroughs:
            return sum(w.normalized_power * 0.95 - self.evaluator.current.current_ftp 
                      for w in breakthroughs if w.normalized_power)
        return 0.0
    
    def _aggregate_concerns(self, workouts) -> List[str]:
        concerns = []
        for w in workouts:
            concerns.extend(w.concerning_metrics)
        return list(set(concerns))[:5]  # Top 5 unique
    
    def _identify_wins(self, workouts) -> List[str]:
        wins = []
        
        breakthroughs = [w for w in workouts if w.breakthrough]
        if breakthroughs:
            wins.append(f"ðŸŽ‰ {len(breakthroughs)} breakthrough workout(s)!")
            
        high_goal_contrib = [w for w in workouts if w.goal_contribution > 0.6]
        if len(high_goal_contrib) >= 3:
            wins.append("âœ… Strong week of goal-aligned training")
            
        low_decoupling = [w for w in workouts if w.decoupling_pct < 5 and w.workout_type in ['endurance', 'long']]
        if low_decoupling:
            wins.append("ðŸ’ª Aerobic efficiency looking solid")
            
        return wins
    
    def to_json(self) -> str:
        """Export all visualization data as JSON."""
        return json.dumps({
            'gap_closure': self.generate_gap_closure_data(),
            'daily_actions': self.generate_daily_action_calendar(),
            'phase_timeline': self.generate_phase_timeline(),
            'load_balance': self.generate_load_balance_chart(),
            'weekly_summary': self.generate_weekly_summary(),
            'progress': self.evaluator.visualize_progress(),
        }, indent=2, default=str)


def generate_ascii_dashboard(evaluator: AutoEvaluator) -> str:
    """
    Generate a simple ASCII dashboard for terminal display.
    """
    viz = ProgressVisualizer(evaluator)
    goal = evaluator.goal
    current = evaluator.current
    gap = evaluator.gap
    
    lines = []
    
    # Header
    lines.append("=" * 70)
    lines.append(f"  RALPH: Progress Dashboard - {goal.race_name}")
    lines.append("=" * 70)
    lines.append("")
    
    # Goal summary
    lines.append(f"  ðŸŽ¯ Race: {goal.race_name}")
    lines.append(f"  ðŸ“… Date: {goal.race_date.strftime('%B %d, %Y')}")
    lines.append(f"  â±ï¸  Days remaining: {goal.days_remaining()}")
    lines.append(f"  ðŸ“Š Current phase: {goal.current_phase().value.upper()}")
    lines.append("")
    
    # Gap analysis
    lines.append("  â”€â”€â”€ GAP ANALYSIS â”€â”€â”€")
    lines.append("")
    
    if gap.ftp_gap:
        ftp_bar = _progress_bar(current.current_ftp, goal.target_ftp)
        achievable = "âœ“" if gap.ftp_achievable else "âš ï¸"
        lines.append(f"  FTP:  {current.current_ftp:.0f}W â†’ {goal.target_ftp:.0f}W  (gap: {gap.ftp_gap:.0f}W) {achievable}")
        lines.append(f"        {ftp_bar}")
        lines.append("")
        
    if gap.pace_gap:
        pace_bar = _progress_bar(goal.target_threshold_pace, current.current_threshold_pace, invert=True)
        achievable = "âœ“" if gap.pace_achievable else "âš ï¸"
        lines.append(f"  Pace: {_format_pace(current.current_threshold_pace)} â†’ {_format_pace(goal.target_threshold_pace)}/mi  (gap: {gap.pace_gap:.0f}s) {achievable}")
        lines.append(f"        {pace_bar}")
        lines.append("")
    
    # Form/load
    lines.append("  â”€â”€â”€ CURRENT FORM â”€â”€â”€")
    lines.append("")
    lines.append(f"  CTL (Fitness):  {current.ctl:.0f}")
    lines.append(f"  ATL (Fatigue):  {current.atl:.0f}")
    lines.append(f"  TSB (Form):     {current.tsb:+.0f}  [{current.form}]")
    lines.append("")
    
    # Feasibility
    feasibility = gap.overall_feasibility()
    lines.append("  â”€â”€â”€ GOAL FEASIBILITY â”€â”€â”€")
    lines.append("")
    lines.append(f"  Probability: {feasibility * 100:.0f}%")
    lines.append(f"  {_feasibility_bar(feasibility)}")
    lines.append("")
    
    # Next 7 days
    lines.append("  â”€â”€â”€ NEXT 7 DAYS â”€â”€â”€")
    lines.append("")
    actions = evaluator.get_daily_actions(days=7)
    for action in actions:
        priority_marker = "â­" if action.priority >= 4 else "  "
        lines.append(f"  {priority_marker} {action.date.strftime('%a %m/%d')}: {action.description} ({action.duration_minutes}min)")
    lines.append("")
    
    lines.append("=" * 70)
    
    return "\n".join(lines)


def _progress_bar(current: float, target: float, width: int = 40, invert: bool = False) -> str:
    """Generate ASCII progress bar."""
    if invert:
        # For pace where lower is better
        pct = min(1.0, target / current if current > 0 else 0)
    else:
        pct = min(1.0, current / target if target > 0 else 0)
        
    filled = int(width * pct)
    empty = width - filled
    return f"[{'â–ˆ' * filled}{'â–‘' * empty}] {pct * 100:.0f}%"


def _feasibility_bar(probability: float, width: int = 40) -> str:
    """Generate ASCII feasibility bar with color zones."""
    filled = int(width * probability)
    
    # Color zones
    red_zone = int(width * 0.3)
    yellow_zone = int(width * 0.6)
    
    bar = ""
    for i in range(width):
        if i < filled:
            if i < red_zone:
                bar += "â–“"  # Low probability zone
            elif i < yellow_zone:
                bar += "â–’"  # Medium zone
            else:
                bar += "â–ˆ"  # Good zone
        else:
            bar += "â–‘"
            
    return f"[{bar}] {probability * 100:.0f}%"


def _format_pace(sec_per_mile: float) -> str:
    """Format pace as M:SS."""
    minutes = int(sec_per_mile // 60)
    seconds = int(sec_per_mile % 60)
    return f"{minutes}:{seconds:02d}"
