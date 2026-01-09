"""
Workout Service
===============
Handles workout file parsing, analysis, and storage.
Wraps the auto_evaluator core logic with database operations.
"""

import gzip
import tempfile
from pathlib import Path
from datetime import datetime, date
from typing import Optional, Tuple, Dict, Any, List
from sqlalchemy.orm import Session

from models.database import (
    Athlete, ExecutedWorkout, PlannedSession, DailyMetrics,
    Sport, ComplianceStatus
)
from models.schemas import WorkoutUploadResponse


class WorkoutService:
    """Service for processing and storing workout data."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def process_fit_file(
        self, 
        athlete_id: int, 
        file_content: bytes, 
        filename: str,
        workout_date: Optional[date] = None
    ) -> WorkoutUploadResponse:
        """
        Process a FIT file upload:
        1. Parse the file
        2. Extract metrics
        3. Match to planned session
        4. Store in database
        5. Return analysis
        """
        # Parse the FIT file
        data = self._parse_fit_file(file_content, filename)
        
        if not data:
            raise ValueError("Could not parse FIT file")
        
        # Get athlete for threshold values
        athlete = self.db.query(Athlete).filter(Athlete.id == athlete_id).first()
        if not athlete:
            raise ValueError(f"Athlete {athlete_id} not found")
        
        # Extract session data
        session = data.get('session', {})
        records = data.get('records', [])
        
        # Determine workout date
        if not workout_date:
            # Try to get from file
            start_time = session.get('start_time')
            if start_time and isinstance(start_time, datetime):
                workout_date = start_time.date()
            else:
                workout_date = date.today()
        
        # Calculate derived metrics
        metrics = self._calculate_metrics(session, records, athlete)
        
        # Determine sport
        sport = self._determine_sport(session)
        
        # Classify workout type
        workout_type = self._classify_workout(metrics)
        
        # Check for breakthrough
        is_breakthrough, breakthrough_detail = self._check_breakthrough(
            metrics, athlete
        )
        
        # Flag concerns
        concerns = self._flag_concerns(metrics)
        
        # Try to match to planned session
        planned_session, compliance = self._match_to_plan(
            athlete_id, workout_date, sport, metrics
        )
        
        # Create workout record
        workout = ExecutedWorkout(
            athlete_id=athlete_id,
            planned_session_id=planned_session.id if planned_session else None,
            workout_date=workout_date,
            sport=sport,
            source="fit_upload",
            fit_file_path=filename,
            
            duration_seconds=session.get('total_elapsed_time'),
            distance_meters=session.get('total_distance'),
            
            avg_pace=self._calculate_avg_pace(session),
            avg_power=session.get('avg_power'),
            normalized_power=metrics.get('normalized_power'),
            max_power=session.get('max_power'),
            
            avg_hr=session.get('avg_heart_rate'),
            max_hr=session.get('max_heart_rate'),
            
            tss=metrics.get('tss'),
            intensity_factor=metrics.get('intensity_factor'),
            variability_index=metrics.get('variability_index'),
            efficiency_factor=metrics.get('efficiency_factor'),
            decoupling_pct=metrics.get('decoupling_pct'),
            
            zone_distribution=metrics.get('zone_distribution'),
            
            workout_type=workout_type,
            compliance_status=compliance,
            
            is_breakthrough=is_breakthrough,
            breakthrough_detail=breakthrough_detail,
            
            goal_contribution=metrics.get('goal_contribution', 0),
            concerns=concerns,
        )
        
        self.db.add(workout)
        self.db.commit()
        self.db.refresh(workout)
        
        # If breakthrough, update athlete's FTP
        if is_breakthrough and metrics.get('new_ftp'):
            athlete.current_ftp = metrics['new_ftp']
            self.db.commit()
        
        return WorkoutUploadResponse(
            id=workout.id,
            workout_date=workout.workout_date,
            sport=workout.sport,
            duration_seconds=workout.duration_seconds,
            distance_meters=workout.distance_meters,
            avg_power=workout.avg_power,
            normalized_power=workout.normalized_power,
            avg_hr=workout.avg_hr,
            intensity_factor=workout.intensity_factor,
            variability_index=workout.variability_index,
            decoupling_pct=workout.decoupling_pct,
            workout_type=workout.workout_type,
            is_breakthrough=workout.is_breakthrough,
            breakthrough_detail=workout.breakthrough_detail,
            compliance_status=workout.compliance_status,
            matched_session_title=planned_session.title if planned_session else None,
            concerns=workout.concerns,
        )
    
    def _parse_fit_file(self, content: bytes, filename: str) -> Optional[Dict]:
        """Parse FIT file with fallback strategies."""
        data = {
            'records': [],
            'laps': [],
            'session': {},
        }
        
        # Handle gzipped files
        if filename.endswith('.gz'):
            content = gzip.decompress(content)
        
        # Write to temp file for parsing libraries
        with tempfile.NamedTemporaryFile(suffix='.fit', delete=False) as f:
            f.write(content)
            temp_path = f.name
        
        try:
            # Try fitparse first
            try:
                from fitparse import FitFile
                fitfile = FitFile(temp_path, check_crc=False)
                
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
            except Exception:
                pass
            
            # Fallback to fitdecode
            try:
                import fitdecode
                with fitdecode.FitReader(temp_path) as fit:
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
            except Exception:
                pass
            
            return None
            
        finally:
            Path(temp_path).unlink(missing_ok=True)
    
    def _calculate_metrics(
        self, 
        session: Dict, 
        records: List[Dict], 
        athlete: Athlete
    ) -> Dict[str, Any]:
        """Calculate derived metrics from workout data."""
        metrics = {}
        
        ftp = athlete.current_ftp or 200
        
        # Power metrics
        power_series = [r.get('power') for r in records if r.get('power')]
        
        if power_series:
            # Normalized Power
            np = self._calculate_normalized_power(power_series)
            metrics['normalized_power'] = np
            
            # Variability Index
            avg_power = session.get('avg_power', sum(power_series) / len(power_series))
            metrics['variability_index'] = np / avg_power if avg_power > 0 else 1.0
            
            # Intensity Factor
            metrics['intensity_factor'] = np / ftp if ftp > 0 else 0
            
            # TSS
            duration_hours = (session.get('total_elapsed_time', 0) or 0) / 3600
            if_val = metrics['intensity_factor']
            metrics['tss'] = (duration_hours * if_val * if_val * 100) if if_val else 0
        
        # Efficiency Factor
        avg_hr = session.get('avg_heart_rate')
        avg_power = session.get('avg_power')
        if avg_power and avg_hr and avg_hr > 0:
            metrics['efficiency_factor'] = avg_power / avg_hr
        
        # Decoupling
        metrics['decoupling_pct'] = self._calculate_decoupling(records)
        
        # Zone distribution
        metrics['zone_distribution'] = self._calculate_zones(records, ftp)
        
        return metrics
    
    def _calculate_normalized_power(self, power_series: List[float]) -> float:
        """Calculate NP using 30-second rolling average."""
        if len(power_series) < 30:
            fourth_powers = [p ** 4 for p in power_series if p]
            if not fourth_powers:
                return 0
            return (sum(fourth_powers) / len(fourth_powers)) ** 0.25
        
        window = 30
        rolling = []
        for i in range(len(power_series) - window + 1):
            avg = sum(power_series[i:i+window]) / window
            rolling.append(avg)
        
        fourth_powers = [p ** 4 for p in rolling]
        return (sum(fourth_powers) / len(fourth_powers)) ** 0.25
    
    def _calculate_decoupling(self, records: List[Dict]) -> float:
        """Calculate aerobic decoupling."""
        if len(records) < 20:
            return 0.0
        
        mid = len(records) // 2
        first_half = records[:mid]
        second_half = records[mid:]
        
        def get_ef(subset):
            powers = [r.get('power', 0) for r in subset if r.get('power')]
            hrs = [r.get('heart_rate', 0) for r in subset if r.get('heart_rate')]
            if powers and hrs:
                avg_p = sum(powers) / len(powers)
                avg_hr = sum(hrs) / len(hrs)
                return avg_p / avg_hr if avg_hr > 0 else 0
            return 0
        
        ef1 = get_ef(first_half)
        ef2 = get_ef(second_half)
        
        if ef1 > 0:
            return ((ef1 - ef2) / ef1) * 100
        return 0.0
    
    def _calculate_zones(self, records: List[Dict], ftp: float) -> Dict[str, float]:
        """Calculate time in each power zone."""
        zones = {f'z{i}': 0 for i in range(1, 7)}
        total = 0
        
        boundaries = [
            (0, 0.55, 'z1'),
            (0.55, 0.75, 'z2'),
            (0.75, 0.90, 'z3'),
            (0.90, 1.05, 'z4'),
            (1.05, 1.20, 'z5'),
            (1.20, 999, 'z6'),
        ]
        
        for record in records:
            power = record.get('power')
            if power and ftp > 0:
                total += 1
                pct = power / ftp
                for low, high, zone in boundaries:
                    if low <= pct < high:
                        zones[zone] += 1
                        break
        
        if total > 0:
            return {z: (count / total) * 100 for z, count in zones.items()}
        return zones
    
    def _determine_sport(self, session: Dict) -> Sport:
        """Determine sport from session data."""
        sport_val = session.get('sport')
        
        if isinstance(sport_val, int):
            sport_map = {0: Sport.OTHER, 1: Sport.RUN, 2: Sport.BIKE, 5: Sport.SWIM}
            return sport_map.get(sport_val, Sport.OTHER)
        
        if isinstance(sport_val, str):
            sport_lower = sport_val.lower()
            if 'run' in sport_lower:
                return Sport.RUN
            if 'cycl' in sport_lower or 'bike' in sport_lower:
                return Sport.BIKE
            if 'swim' in sport_lower:
                return Sport.SWIM
        
        return Sport.OTHER
    
    def _classify_workout(self, metrics: Dict) -> str:
        """Classify workout type based on metrics."""
        if_val = metrics.get('intensity_factor', 0)
        
        if if_val < 0.65:
            return "easy"
        elif if_val < 0.80:
            return "endurance"
        elif if_val < 0.90:
            return "tempo"
        elif if_val < 1.00:
            return "threshold"
        elif if_val < 1.10:
            return "vo2max"
        else:
            return "race"
    
    def _check_breakthrough(
        self, 
        metrics: Dict, 
        athlete: Athlete
    ) -> Tuple[bool, Optional[str]]:
        """Check if workout represents a breakthrough."""
        np = metrics.get('normalized_power')
        current_ftp = athlete.current_ftp or 200
        
        if np:
            estimated_ftp = np * 0.95
            if estimated_ftp > current_ftp * 1.02:  # 2%+ gain
                metrics['new_ftp'] = estimated_ftp
                return True, f"FTP increase: {current_ftp:.0f}W → {estimated_ftp:.0f}W"
        
        # Low decoupling at high IF
        if_val = metrics.get('intensity_factor', 0)
        decoupling = metrics.get('decoupling_pct', 100)
        if if_val > 0.85 and decoupling < 3:
            return True, "Exceptional aerobic efficiency at threshold"
        
        return False, None
    
    def _flag_concerns(self, metrics: Dict) -> List[str]:
        """Flag concerning metrics."""
        concerns = []
        
        decoupling = metrics.get('decoupling_pct', 0)
        if decoupling > 10:
            concerns.append(f"High decoupling ({decoupling:.1f}%) - aerobic base needs work")
        
        vi = metrics.get('variability_index', 1)
        if vi > 1.15:
            concerns.append(f"High variability (VI={vi:.2f}) - pacing inconsistent")
        
        return concerns
    
    def _match_to_plan(
        self, 
        athlete_id: int, 
        workout_date: date, 
        sport: Sport, 
        metrics: Dict
    ) -> Tuple[Optional[PlannedSession], ComplianceStatus]:
        """Try to match workout to a planned session."""
        # Find planned sessions for this athlete on this date
        from models.database import TrainingPlan
        
        # Get active plan
        plan = self.db.query(TrainingPlan).filter(
            TrainingPlan.athlete_id == athlete_id,
            TrainingPlan.is_active == True
        ).first()
        
        if not plan:
            return None, ComplianceStatus.PENDING
        
        # Find session for this date
        session = self.db.query(PlannedSession).filter(
            PlannedSession.plan_id == plan.id,
            PlannedSession.date == workout_date
        ).first()
        
        if not session:
            return None, ComplianceStatus.SWAPPED
        
        # Check if sports roughly match
        sport_match = (
            session.sport == sport or
            (session.sport == Sport.BIKE and sport == Sport.BIKE) or
            (session.sport == Sport.RUN and sport == Sport.RUN)
        )
        
        if not sport_match:
            return session, ComplianceStatus.SWAPPED
        
        # Evaluate compliance
        compliance = self._evaluate_compliance(session, metrics)
        
        return session, compliance
    
    def _evaluate_compliance(
        self, 
        session: PlannedSession, 
        metrics: Dict
    ) -> ComplianceStatus:
        """Evaluate how well workout matched prescription."""
        issues = []
        
        # Check duration (if prescribed)
        # Note: We'd need duration from the actual workout
        
        # Check power (if prescribed)
        np = metrics.get('normalized_power')
        if session.target_power_low and np:
            if np < session.target_power_low * 0.9:
                issues.append("underpowered")
            elif session.target_power_high and np > session.target_power_high * 1.1:
                issues.append("overpowered")
        
        if not issues:
            return ComplianceStatus.NAILED
        elif "overpowered" in issues:
            return ComplianceStatus.EXCEEDED
        elif len(issues) == 1:
            return ComplianceStatus.COMPLETED
        else:
            return ComplianceStatus.MODIFIED
    
    def _calculate_avg_pace(self, session: Dict) -> Optional[float]:
        """Calculate average pace in sec/mile."""
        speed = session.get('enhanced_avg_speed') or session.get('avg_speed')
        if speed and speed > 0:
            # speed is in m/s, convert to sec/mile
            return 1609.34 / speed
        return None
    
    def get_athlete_workouts(
        self, 
        athlete_id: int, 
        limit: int = 10
    ) -> List[ExecutedWorkout]:
        """Get recent workouts for an athlete."""
        return self.db.query(ExecutedWorkout).filter(
            ExecutedWorkout.athlete_id == athlete_id
        ).order_by(
            ExecutedWorkout.workout_date.desc()
        ).limit(limit).all()
    
    def calculate_load_metrics(self, athlete_id: int) -> Dict[str, float]:
        """Calculate CTL, ATL, TSB for an athlete."""
        from datetime import timedelta
        
        # Get last 42 days of workouts
        cutoff = date.today() - timedelta(days=42)
        workouts = self.db.query(ExecutedWorkout).filter(
            ExecutedWorkout.athlete_id == athlete_id,
            ExecutedWorkout.workout_date >= cutoff
        ).all()
        
        # Simple calculation (would be EMA in production)
        tss_7day = sum(w.tss or 0 for w in workouts if w.workout_date >= date.today() - timedelta(days=7))
        tss_42day = sum(w.tss or 0 for w in workouts)
        
        atl = tss_7day / 7  # Simplified
        ctl = tss_42day / 42  # Simplified
        tsb = ctl - atl
        
        # Determine form
        if tsb > 25:
            form = "FRESH"
        elif tsb > 5:
            form = "RECOVERED"
        elif tsb > -10:
            form = "NEUTRAL"
        elif tsb > -30:
            form = "TIRED"
        else:
            form = "OVERREACHED"
        
        return {
            'ctl': round(ctl, 1),
            'atl': round(atl, 1),
            'tsb': round(tsb, 1),
            'form': form,
        }
