"""
RALPH: Real-time Athlete Learning & Performance Handler
========================================================
Automatic workout file evaluation with dynamic plan adjustment.

This module provides the core evaluation engine that:
1. Ingests workout files automatically
2. Extracts physiological signals
3. Compares against goal trajectories
4. Triggers plan adjustments
5. Visualizes daily progress toward long-term goals
"""

import gzip
import json
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Optional, List, Dict, Any
import numpy as np


class TrainingPhase(Enum):
    """Periodization phases mapped to physiological adaptations."""
    BASE = "base"           # Aerobic development, volume focus
    BUILD = "build"         # Threshold/VO2max, intensity introduction
    PEAK = "peak"           # Race-specific, reduced volume, high quality
    TAPER = "taper"         # Recovery, sharpening
    RECOVERY = "recovery"   # Active recovery between cycles


class AdaptationSignal(Enum):
    """Physiological signals extracted from workout data."""
    AEROBIC_EFFICIENCY = "aerobic_efficiency"      # Power:HR or Pace:HR
    THRESHOLD_POWER = "threshold_power"            # FTP / Critical Power
    THRESHOLD_PACE = "threshold_pace"              # Running LT
    ANAEROBIC_CAPACITY = "anaerobic_capacity"      # W' / Anaerobic reserve
    FATIGUE_RESISTANCE = "fatigue_resistance"      # Decoupling %
    RECOVERY_RATE = "recovery_rate"                # Time to green
    NEUROMUSCULAR = "neuromuscular"                # Sprint power, cadence


@dataclass
class GoalState:
    """Represents the target state for race day."""
    race_name: str
    race_date: datetime
    goal_type: str  # "time", "completion", "placement"
    
    # Target metrics (set based on goal)
    target_ftp: Optional[float] = None           # Watts
    target_threshold_pace: Optional[float] = None # sec/mile
    target_long_duration: Optional[float] = None  # minutes
    target_weekly_volume: Optional[float] = None  # hours or miles
    
    # Course factors
    elevation_gain: int = 0
    heat_factor: float = 1.0  # 1.0 = normal, 1.1 = hot
    altitude_factor: float = 1.0
    
    def days_remaining(self) -> int:
        return (self.race_date - datetime.now()).days
    
    def current_phase(self) -> TrainingPhase:
        """Determine training phase based on days to race."""
        days = self.days_remaining()
        if days > 84:  # 12+ weeks
            return TrainingPhase.BASE
        elif days > 42:  # 6-12 weeks
            return TrainingPhase.BUILD
        elif days > 14:  # 2-6 weeks
            return TrainingPhase.PEAK
        elif days > 0:
            return TrainingPhase.TAPER
        return TrainingPhase.RECOVERY


@dataclass
class CurrentState:
    """Represents athlete's current fitness state."""
    # Core metrics
    current_ftp: float = 0.0
    current_threshold_pace: float = 0.0  # sec/mile
    current_long_duration: float = 0.0   # minutes
    current_weekly_volume: float = 0.0
    
    # Derived metrics
    aerobic_efficiency: float = 0.0      # Power/HR or Pace/HR
    fatigue_resistance: float = 0.0      # % decoupling
    w_prime: float = 0.0                 # Anaerobic capacity (kJ)
    
    # Recovery state
    recovery_score: int = 100            # 0-100
    recovery_trend: str = "stable"       # improving, declining, stable
    days_since_quality: int = 0
    
    # Load metrics
    ctl: float = 0.0                     # Chronic Training Load (42-day)
    atl: float = 0.0                     # Acute Training Load (7-day)
    tsb: float = 0.0                     # Training Stress Balance (CTL-ATL)
    
    @property
    def form(self) -> str:
        """Interpret TSB as form state."""
        if self.tsb > 25:
            return "FRESH"      # Well rested, peak performance
        elif self.tsb > 5:
            return "RECOVERED"  # Good for quality work
        elif self.tsb > -10:
            return "NEUTRAL"    # Balanced
        elif self.tsb > -30:
            return "TIRED"      # Accumulated fatigue
        return "OVERREACHED"    # Need recovery


@dataclass 
class GapAnalysis:
    """Quantified gaps between current and goal states."""
    ftp_gap: float = 0.0           # Watts needed
    pace_gap: float = 0.0          # sec/mile needed
    volume_gap: float = 0.0        # hours/miles needed
    duration_gap: float = 0.0      # minutes needed for long session
    
    ftp_gap_pct: float = 0.0
    pace_gap_pct: float = 0.0
    
    weeks_available: int = 0
    
    # Feasibility assessment
    ftp_achievable: bool = True    # ~1-2% per week realistic
    pace_achievable: bool = True   # ~2-3 sec/mile per week realistic
    volume_safe: bool = True       # <10% weekly increase
    
    def overall_feasibility(self) -> float:
        """Return 0-1 probability of achieving goal."""
        score = 0.5  # Base
        
        # FTP gap assessment
        weekly_ftp_needed = self.ftp_gap / max(self.weeks_available, 1)
        if weekly_ftp_needed <= 2:
            score += 0.15
        elif weekly_ftp_needed <= 4:
            score += 0.05
        else:
            score -= 0.15
            
        # Pace gap assessment  
        weekly_pace_needed = self.pace_gap / max(self.weeks_available, 1)
        if weekly_pace_needed <= 3:
            score += 0.15
        elif weekly_pace_needed <= 6:
            score += 0.05
        else:
            score -= 0.15
            
        # Timeline bonus/penalty
        if self.weeks_available >= 12:
            score += 0.10
        elif self.weeks_available < 6:
            score -= 0.15
            
        return max(0.05, min(0.95, score))


@dataclass
class DailyAction:
    """Small daily action toward the goal."""
    date: datetime
    action_type: str          # "workout", "recovery", "nutrition", "sleep"
    description: str          # Human-readable
    target_metric: str        # What this improves
    duration_minutes: int
    priority: int             # 1-5, 5 = critical
    
    # Success criteria
    success_metric: str       # e.g., "avg_power", "hr_drift"
    success_threshold: float  # e.g., 200, 0.05
    success_comparator: str   # ">=", "<=", "<", ">"
    
    # Adjustment rules
    if_recovery_yellow: str
    if_recovery_red: str


@dataclass
class WorkoutEvaluation:
    """Result of automatic workout file evaluation."""
    file_path: str
    workout_date: datetime
    sport: str
    
    # Raw metrics extracted
    duration_seconds: int
    distance_meters: float
    avg_power: Optional[float]
    normalized_power: Optional[float]
    avg_hr: Optional[float]
    max_hr: Optional[float]
    avg_pace: Optional[float]  # sec/km
    tss: Optional[float]
    
    # Derived signals
    intensity_factor: float
    variability_index: float
    efficiency_factor: float
    decoupling_pct: float
    
    # Classification
    workout_type: str         # "easy", "tempo", "threshold", "vo2max", "race"
    zone_distribution: Dict[int, float]  # Zone -> % time
    
    # Goal impact
    signals_improved: List[AdaptationSignal]
    goal_contribution: float  # 0-1, how much this helps the goal
    
    # Flags
    breakthrough: bool = False
    concerning_metrics: List[str] = field(default_factory=list)
    

class AutoEvaluator:
    """
    Core engine for automatic workout evaluation and plan adjustment.
    
    Usage:
        evaluator = AutoEvaluator(goal, current_state)
        evaluation = evaluator.evaluate_workout(fit_file_path)
        adjustments = evaluator.get_plan_adjustments()
        daily_actions = evaluator.get_daily_actions(days=7)
    """
    
    def __init__(self, goal: GoalState, current: CurrentState):
        self.goal = goal
        self.current = current
        self.history: List[WorkoutEvaluation] = []
        self.gap = self._calculate_gaps()
        
    def _calculate_gaps(self) -> GapAnalysis:
        """Calculate all gaps between current and goal states."""
        gap = GapAnalysis()
        gap.weeks_available = self.goal.days_remaining() // 7
        
        if self.goal.target_ftp and self.current.current_ftp:
            gap.ftp_gap = self.goal.target_ftp - self.current.current_ftp
            gap.ftp_gap_pct = (gap.ftp_gap / self.current.current_ftp) * 100
            # 1-2% per week is realistic
            gap.ftp_achievable = gap.ftp_gap_pct <= (gap.weeks_available * 1.5)
            
        if self.goal.target_threshold_pace and self.current.current_threshold_pace:
            gap.pace_gap = self.current.current_threshold_pace - self.goal.target_threshold_pace
            gap.pace_gap_pct = (gap.pace_gap / self.current.current_threshold_pace) * 100
            # 2-3 sec/mile per week is realistic
            gap.pace_achievable = gap.pace_gap <= (gap.weeks_available * 3)
            
        if self.goal.target_weekly_volume and self.current.current_weekly_volume:
            gap.volume_gap = self.goal.target_weekly_volume - self.current.current_weekly_volume
            # Max 10% weekly increase
            max_safe_volume = self.current.current_weekly_volume * (1.1 ** gap.weeks_available)
            gap.volume_safe = self.goal.target_weekly_volume <= max_safe_volume
            
        if self.goal.target_long_duration and self.current.current_long_duration:
            gap.duration_gap = self.goal.target_long_duration - self.current.current_long_duration
            
        return gap
    
    def evaluate_workout(self, file_path: str) -> WorkoutEvaluation:
        """
        Automatically evaluate a workout file and extract signals.
        
        Supports: .fit, .fit.gz, .tcx, .gpx
        """
        path = Path(file_path)
        
        # Parse the file
        data = self._parse_workout_file(path)
        
        # Calculate derived metrics
        evaluation = self._build_evaluation(path, data)
        
        # Detect breakthrough
        evaluation.breakthrough = self._detect_breakthrough(evaluation)
        
        # Flag concerning metrics
        evaluation.concerning_metrics = self._flag_concerns(evaluation)
        
        # Calculate goal contribution
        evaluation.goal_contribution = self._calculate_goal_contribution(evaluation)
        
        # Store in history
        self.history.append(evaluation)
        
        # Update current state
        self._update_current_state(evaluation)
        
        return evaluation
    
    def _parse_workout_file(self, path: Path) -> Dict[str, Any]:
        """Parse workout file with fallback strategies."""
        data = {
            'records': [],
            'laps': [],
            'session': {},
        }
        
        # Handle gzipped files
        if path.suffix == '.gz':
            with gzip.open(path, 'rb') as f:
                fit_data = f.read()
            temp_path = Path('/tmp/temp.fit')
            temp_path.write_bytes(fit_data)
            path = temp_path
            
        # Try fitparse first
        try:
            from fitparse import FitFile
            fitfile = FitFile(str(path), check_crc=False)
            
            for record in fitfile.get_messages('record'):
                rec = {}
                for field in record.fields:
                    rec[field.name] = field.value
                data['records'].append(rec)
                
            for lap in fitfile.get_messages('lap'):
                lap_data = {}
                for field in lap.fields:
                    lap_data[field.name] = field.value
                data['laps'].append(lap_data)
                
            for session in fitfile.get_messages('session'):
                for field in session.fields:
                    data['session'][field.name] = field.value
                    
            return data
        except Exception as e:
            pass
            
        # Fallback to fitdecode
        try:
            import fitdecode
            with fitdecode.FitReader(str(path)) as fit:
                for frame in fit:
                    if frame.frame_type == fitdecode.FIT_FRAME_DATA:
                        if frame.name == 'record':
                            rec = {f.name: f.value for f in frame.fields}
                            data['records'].append(rec)
                        elif frame.name == 'lap':
                            lap_data = {f.name: f.value for f in frame.fields}
                            data['laps'].append(lap_data)
                        elif frame.name == 'session':
                            for f in frame.fields:
                                data['session'][f.name] = f.value
            return data
        except Exception as e:
            raise ValueError(f"Could not parse {path}: {e}")
    
    def _build_evaluation(self, path: Path, data: Dict) -> WorkoutEvaluation:
        """Build evaluation from parsed data."""
        session = data.get('session', {})
        records = data.get('records', [])
        
        # Extract power series if available
        power_series = [r.get('power') for r in records if r.get('power')]
        hr_series = [r.get('heart_rate') for r in records if r.get('heart_rate')]
        
        # Calculate normalized power
        np_value = None
        if power_series:
            np_value = self._calculate_normalized_power(power_series)
            
        avg_power = session.get('avg_power')
        
        # Variability Index
        vi = (np_value / avg_power) if (np_value and avg_power) else 1.0
        
        # Intensity Factor
        if_value = (np_value / self.current.current_ftp) if (np_value and self.current.current_ftp) else 0.0
        
        # Efficiency Factor (for running/cycling)
        ef = 0.0
        avg_hr = session.get('avg_heart_rate')
        if avg_power and avg_hr:
            ef = avg_power / avg_hr
        elif session.get('enhanced_avg_speed') and avg_hr:
            ef = session.get('enhanced_avg_speed') / avg_hr
            
        # Decoupling (first half EF vs second half EF)
        decoupling = self._calculate_decoupling(records)
        
        # Zone distribution
        zones = self._calculate_zone_distribution(records)
        
        # Classify workout type
        workout_type = self._classify_workout(if_value, vi, zones)
        
        # Determine sport
        sport = session.get('sport', 'unknown')
        if isinstance(sport, int):
            sport_map = {0: 'generic', 1: 'running', 2: 'cycling', 5: 'swimming'}
            sport = sport_map.get(sport, 'unknown')
            
        return WorkoutEvaluation(
            file_path=str(path),
            workout_date=datetime.now(),  # Would extract from file
            sport=str(sport),
            duration_seconds=session.get('total_elapsed_time', 0),
            distance_meters=session.get('total_distance', 0),
            avg_power=avg_power,
            normalized_power=np_value,
            avg_hr=avg_hr,
            max_hr=session.get('max_heart_rate'),
            avg_pace=session.get('enhanced_avg_speed'),
            tss=session.get('training_stress_score'),
            intensity_factor=if_value,
            variability_index=vi,
            efficiency_factor=ef,
            decoupling_pct=decoupling,
            workout_type=workout_type,
            zone_distribution=zones,
            signals_improved=[],
            goal_contribution=0.0,
        )
    
    def _calculate_normalized_power(self, power_series: List[float]) -> float:
        """
        Calculate NP using 30-second rolling average.
        
        NP accounts for the metabolic cost of variability:
        1. Calculate 30-sec rolling average
        2. Raise each value to 4th power
        3. Take mean of 4th powers
        4. Take 4th root
        
        For highly variable efforts, NP will be higher than AP.
        """
        if len(power_series) < 30:
            # For short series, raise each point to 4th power directly
            fourth_powers = [p ** 4 for p in power_series]
            return (sum(fourth_powers) / len(fourth_powers)) ** 0.25
            
        # 30-second rolling average (simulating 1-sec data)
        window = 30
        rolling = []
        for i in range(len(power_series) - window + 1):
            rolling.append(sum(power_series[i:i+window]) / window)
            
        # Raise each rolling average to 4th power, then average and take 4th root
        fourth_powers = [p ** 4 for p in rolling]
        return (sum(fourth_powers) / len(fourth_powers)) ** 0.25
    
    def _calculate_decoupling(self, records: List[Dict]) -> float:
        """Calculate aerobic decoupling (Pw:HR or Pace:HR drift)."""
        if len(records) < 20:
            return 0.0
            
        mid = len(records) // 2
        first_half = records[:mid]
        second_half = records[mid:]
        
        def get_ef(subset):
            powers = [r.get('power', 0) for r in subset if r.get('power')]
            hrs = [r.get('heart_rate', 0) for r in subset if r.get('heart_rate')]
            if powers and hrs:
                return (sum(powers) / len(powers)) / (sum(hrs) / len(hrs))
            return 0
            
        ef1 = get_ef(first_half)
        ef2 = get_ef(second_half)
        
        if ef1 > 0:
            return ((ef1 - ef2) / ef1) * 100
        return 0.0
    
    def _calculate_zone_distribution(self, records: List[Dict]) -> Dict[int, float]:
        """Calculate time in each power/HR zone."""
        zones = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0}
        total = 0
        
        ftp = self.current.current_ftp or 200  # Default
        
        # Zone boundaries (% of FTP)
        boundaries = [
            (0, 0.55, 1),     # Z1: Recovery
            (0.55, 0.75, 2),  # Z2: Endurance
            (0.75, 0.90, 3),  # Z3: Tempo
            (0.90, 1.05, 4),  # Z4: Threshold
            (1.05, 1.20, 5),  # Z5: VO2max
            (1.20, 999, 6),   # Z6: Anaerobic
        ]
        
        for record in records:
            power = record.get('power')
            if power:
                total += 1
                pct = power / ftp
                for low, high, zone in boundaries:
                    if low <= pct < high:
                        zones[zone] += 1
                        break
                        
        if total > 0:
            return {z: (count / total) * 100 for z, count in zones.items()}
        return zones
    
    def _classify_workout(self, if_value: float, vi: float, zones: Dict) -> str:
        """Classify workout type based on metrics."""
        if if_value < 0.65:
            return "easy"
        elif if_value < 0.80:
            return "endurance"
        elif if_value < 0.90:
            return "tempo"
        elif if_value < 1.00:
            return "threshold"
        elif if_value < 1.10:
            return "vo2max"
        else:
            return "race"
    
    def _detect_breakthrough(self, evaluation: WorkoutEvaluation) -> bool:
        """Detect if this workout represents a breakthrough."""
        # Check for new FTP
        if evaluation.normalized_power:
            # 20-min effort with IF > 1.0 suggests FTP increase
            if evaluation.duration_seconds >= 1200:  # 20+ min
                estimated_ftp = evaluation.normalized_power * 0.95
                if estimated_ftp > self.current.current_ftp * 1.02:  # 2%+ gain
                    return True
                    
        # Check for exceptionally low decoupling at high IF
        if evaluation.intensity_factor > 0.85 and evaluation.decoupling_pct < 3:
            return True
            
        return False
    
    def _flag_concerns(self, evaluation: WorkoutEvaluation) -> List[str]:
        """Flag concerning metrics in the workout."""
        concerns = []
        
        if evaluation.decoupling_pct > 10:
            concerns.append(f"High decoupling ({evaluation.decoupling_pct:.1f}%) - aerobic base needs work")
            
        if evaluation.variability_index > 1.15 and evaluation.workout_type not in ["race", "vo2max"]:
            concerns.append(f"High variability (VI={evaluation.variability_index:.2f}) - pacing inconsistent")
            
        if evaluation.avg_hr and evaluation.max_hr:
            hr_spike = evaluation.max_hr / evaluation.avg_hr
            if hr_spike > 1.25:
                concerns.append("Large HR spikes - possible cardiac drift or equipment issue")
                
        return concerns
    
    def _calculate_goal_contribution(self, evaluation: WorkoutEvaluation) -> float:
        """Calculate how much this workout contributes to the goal."""
        phase = self.goal.current_phase()
        score = 0.0
        
        # Phase-appropriate workout scoring
        if phase == TrainingPhase.BASE:
            # Value endurance, low decoupling
            if evaluation.workout_type in ["easy", "endurance"]:
                score += 0.3
            if evaluation.decoupling_pct < 5:
                score += 0.2
            if evaluation.zone_distribution.get(2, 0) > 50:
                score += 0.2
                
        elif phase == TrainingPhase.BUILD:
            # Value threshold work
            if evaluation.workout_type in ["tempo", "threshold"]:
                score += 0.3
            if 0.85 <= evaluation.intensity_factor <= 1.0:
                score += 0.2
                
        elif phase == TrainingPhase.PEAK:
            # Value race-specific, high quality
            if evaluation.workout_type in ["threshold", "vo2max", "race"]:
                score += 0.3
            if evaluation.breakthrough:
                score += 0.3
                
        elif phase == TrainingPhase.TAPER:
            # Value easy days, occasional openers
            if evaluation.workout_type == "easy":
                score += 0.2
            if evaluation.duration_seconds < 3600:  # <1hr
                score += 0.1
                
        # Bonus for breakthrough
        if evaluation.breakthrough:
            score += 0.2
            
        return min(1.0, score)
    
    def _update_current_state(self, evaluation: WorkoutEvaluation):
        """Update current state based on new workout."""
        # Update FTP if breakthrough detected
        if evaluation.breakthrough and evaluation.normalized_power:
            new_ftp = evaluation.normalized_power * 0.95
            if new_ftp > self.current.current_ftp:
                self.current.current_ftp = new_ftp
                
        # Update load metrics (simplified)
        tss = evaluation.tss or (evaluation.intensity_factor ** 2 * 
                                  evaluation.duration_seconds / 3600 * 100)
        
        # Exponential moving averages
        self.current.atl = self.current.atl * 0.857 + tss * 0.143  # 7-day
        self.current.ctl = self.current.ctl * 0.976 + tss * 0.024  # 42-day
        self.current.tsb = self.current.ctl - self.current.atl
        
        # Recalculate gaps
        self.gap = self._calculate_gaps()
    
    def get_plan_adjustments(self) -> Dict[str, Any]:
        """Get recommended plan adjustments based on current state and history."""
        adjustments = {
            'volume_change': 0,        # % change
            'intensity_change': 0,     # % change  
            'recovery_days_add': 0,    # Days to add
            'key_sessions_modify': [], # Specific session changes
            'reasoning': [],           # Explanation
        }
        
        # Check form (TSB)
        form = self.current.form
        if form == "OVERREACHED":
            adjustments['volume_change'] = -20
            adjustments['recovery_days_add'] = 2
            adjustments['reasoning'].append("TSB indicates overreaching - reducing load")
            
        elif form == "TIRED":
            adjustments['intensity_change'] = -10
            adjustments['reasoning'].append("Accumulated fatigue - reducing intensity")
            
        elif form == "FRESH" and self.goal.current_phase() != TrainingPhase.TAPER:
            adjustments['intensity_change'] = 5
            adjustments['reasoning'].append("Well recovered - can push harder")
            
        # Check recent breakthrough
        recent = [e for e in self.history[-5:] if e.breakthrough]
        if recent:
            adjustments['key_sessions_modify'].append({
                'action': 'update_zones',
                'new_ftp': self.current.current_ftp,
                'reason': 'Breakthrough detected - update training zones'
            })
            
        # Check decoupling trends
        recent_decoupling = [e.decoupling_pct for e in self.history[-5:] if e.decoupling_pct]
        if recent_decoupling and np.mean(recent_decoupling) > 8:
            adjustments['key_sessions_modify'].append({
                'action': 'add_aerobic_work',
                'reason': 'Decoupling trending high - need more Z2 volume'
            })
            
        return adjustments
    
    def get_daily_actions(self, days: int = 7) -> List[DailyAction]:
        """
        Generate specific daily actions toward the goal.
        
        This is the "small daily actions toward long-term success" visualization.
        """
        actions = []
        phase = self.goal.current_phase()
        today = datetime.now()
        
        # Weekly structure templates by phase
        templates = {
            TrainingPhase.BASE: [
                ("recovery", "Rest or easy movement", 30, 2),
                ("endurance", "Zone 2 steady state", 60, 4),
                ("recovery", "Active recovery", 30, 2),
                ("endurance", "Zone 2 with strides", 50, 3),
                ("rest", "Complete rest", 0, 1),
                ("long", "Long aerobic session", 90, 5),
                ("recovery", "Easy spin/jog", 30, 2),
            ],
            TrainingPhase.BUILD: [
                ("recovery", "Rest or easy movement", 30, 2),
                ("threshold", "Tempo/Threshold intervals", 60, 5),
                ("recovery", "Active recovery", 30, 2),
                ("vo2max", "VO2max intervals", 50, 5),
                ("rest", "Complete rest", 0, 1),
                ("long", "Long with race-pace finish", 90, 5),
                ("endurance", "Easy endurance", 45, 3),
            ],
            TrainingPhase.PEAK: [
                ("recovery", "Rest", 30, 2),
                ("race_specific", "Race-pace simulation", 60, 5),
                ("recovery", "Easy movement", 30, 2),
                ("opener", "Short sharp intervals", 40, 4),
                ("rest", "Complete rest", 0, 1),
                ("long", "Dress rehearsal", 75, 5),
                ("recovery", "Flush ride/jog", 30, 2),
            ],
            TrainingPhase.TAPER: [
                ("recovery", "Easy movement", 20, 2),
                ("opener", "Short openers", 30, 3),
                ("rest", "Complete rest", 0, 1),
                ("activation", "Race activation", 20, 3),
                ("rest", "Complete rest", 0, 1),
                ("race", "RACE DAY", 0, 5),
                ("recovery", "Recovery", 0, 1),
            ],
        }
        
        template = templates.get(phase, templates[TrainingPhase.BASE])
        
        for i in range(min(days, 7)):
            day_template = template[i % 7]
            action_type, description, duration, priority = day_template
            
            # Customize based on current gaps
            if self.gap.ftp_gap_pct > 5 and action_type == "threshold":
                description = f"Threshold work @ {self.current.current_ftp * 0.95:.0f}-{self.current.current_ftp * 1.0:.0f}W"
                
            if self.gap.pace_gap > 20 and action_type == "race_specific":
                target_pace = self.current.current_threshold_pace - 5
                description = f"Race pace reps @ {self._format_pace(target_pace)}/mi"
                
            actions.append(DailyAction(
                date=today + timedelta(days=i),
                action_type=action_type,
                description=description,
                target_metric=self._get_target_metric(action_type),
                duration_minutes=duration,
                priority=priority,
                success_metric=self._get_success_metric(action_type),
                success_threshold=self._get_success_threshold(action_type),
                success_comparator=self._get_success_comparator(action_type),
                if_recovery_yellow=self._get_yellow_adjustment(action_type),
                if_recovery_red=self._get_red_adjustment(action_type),
            ))
            
        return actions
    
    def _format_pace(self, sec_per_mile: float) -> str:
        """Format pace as M:SS."""
        minutes = int(sec_per_mile // 60)
        seconds = int(sec_per_mile % 60)
        return f"{minutes}:{seconds:02d}"
    
    def _get_target_metric(self, action_type: str) -> str:
        metrics = {
            "recovery": "recovery_score",
            "endurance": "aerobic_efficiency",
            "threshold": "threshold_power",
            "vo2max": "vo2max_power",
            "long": "fatigue_resistance",
            "race_specific": "race_readiness",
            "rest": "recovery_score",
            "opener": "neuromuscular",
            "activation": "readiness",
            "race": "performance",
        }
        return metrics.get(action_type, "general_fitness")
    
    def _get_success_metric(self, action_type: str) -> str:
        metrics = {
            "endurance": "decoupling_pct",
            "threshold": "avg_power",
            "vo2max": "interval_power",
            "long": "completion",
            "recovery": "hr_recovery",
        }
        return metrics.get(action_type, "completion")
    
    def _get_success_threshold(self, action_type: str) -> float:
        thresholds = {
            "endurance": 5.0,  # <5% decoupling
            "threshold": self.current.current_ftp * 0.95,
            "vo2max": self.current.current_ftp * 1.1,
            "long": 1.0,  # Completed
        }
        return thresholds.get(action_type, 1.0)
    
    def _get_success_comparator(self, action_type: str) -> str:
        comparators = {
            "endurance": "<=",
            "threshold": ">=",
            "vo2max": ">=",
        }
        return comparators.get(action_type, ">=")
    
    def _get_yellow_adjustment(self, action_type: str) -> str:
        adjustments = {
            "threshold": "Reduce power targets by 5%",
            "vo2max": "Reduce intervals by 1, extend recovery",
            "long": "Reduce duration by 15%",
            "endurance": "Execute as planned",
            "recovery": "Execute as planned",
        }
        return adjustments.get(action_type, "Reduce intensity")
    
    def _get_red_adjustment(self, action_type: str) -> str:
        adjustments = {
            "threshold": "Convert to easy endurance",
            "vo2max": "Skip - take rest day",
            "long": "Reduce to 60% duration, Z1 only",
            "endurance": "Convert to recovery",
            "recovery": "Execute as planned",
        }
        return adjustments.get(action_type, "Convert to rest")
    
    def visualize_progress(self) -> Dict[str, Any]:
        """
        Generate data for visualizing progress toward goal.
        
        Returns metrics for dashboards/charts showing:
        - Current vs Target (gap closure)
        - Daily actions completed
        - Trend lines
        - Phase progression
        """
        return {
            'goal': {
                'race_name': self.goal.race_name,
                'race_date': self.goal.race_date.isoformat(),
                'days_remaining': self.goal.days_remaining(),
                'current_phase': self.goal.current_phase().value,
            },
            'gaps': {
                'ftp': {
                    'current': self.current.current_ftp,
                    'target': self.goal.target_ftp,
                    'gap': self.gap.ftp_gap,
                    'gap_pct': self.gap.ftp_gap_pct,
                    'achievable': self.gap.ftp_achievable,
                },
                'pace': {
                    'current': self.current.current_threshold_pace,
                    'target': self.goal.target_threshold_pace,
                    'gap': self.gap.pace_gap,
                    'gap_pct': self.gap.pace_gap_pct,
                    'achievable': self.gap.pace_achievable,
                },
            },
            'load': {
                'ctl': self.current.ctl,
                'atl': self.current.atl,
                'tsb': self.current.tsb,
                'form': self.current.form,
            },
            'feasibility': self.gap.overall_feasibility(),
            'recent_workouts': [
                {
                    'date': e.workout_date.isoformat(),
                    'type': e.workout_type,
                    'goal_contribution': e.goal_contribution,
                    'breakthrough': e.breakthrough,
                }
                for e in self.history[-7:]
            ],
        }


# Factory function for easy instantiation
def create_evaluator(
    race_name: str,
    race_date: str,
    goal_time: Optional[str] = None,
    current_ftp: float = 0,
    current_threshold_pace: float = 0,
) -> AutoEvaluator:
    """
    Factory function to create an evaluator with minimal inputs.
    
    Args:
        race_name: Name of target race
        race_date: ISO format date string (YYYY-MM-DD)
        goal_time: Target time (e.g., "1:19:00" for half marathon)
        current_ftp: Current FTP in watts
        current_threshold_pace: Current threshold pace in sec/mile
        
    Returns:
        Configured AutoEvaluator instance
    """
    goal = GoalState(
        race_name=race_name,
        race_date=datetime.fromisoformat(race_date),
        goal_type="time" if goal_time else "completion",
        target_ftp=current_ftp * 1.05 if current_ftp else None,  # Default 5% improvement
        target_threshold_pace=current_threshold_pace * 0.95 if current_threshold_pace else None,
    )
    
    current = CurrentState(
        current_ftp=current_ftp,
        current_threshold_pace=current_threshold_pace,
    )
    
    return AutoEvaluator(goal, current)
