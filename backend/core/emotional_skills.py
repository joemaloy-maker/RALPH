"""
Emotional Skill Development Module
==================================
Based on Chambliss's key insight: Elite performers don't just TOLERATE 
what others find boring/hard - they genuinely ENJOY it.

"The very features of the sport which the 'C' swimmer finds unpleasant, 
the top-level swimmer enjoys. What others see as boring â€“ swimming back 
and forth over a black line for two hours â€“ they find peaceful, even 
meditative, often challenging, or therapeutic."

This is a SKILL that can be developed, not a fixed trait.

This module teaches athletes to:
1. Reframe aversive sessions as opportunities
2. Find intrinsic satisfaction in process, not just outcomes
3. Shrink the mental frame (focus on THIS lap, THIS interval)
4. Build positive associations through deliberate attention
5. Normalize race day until it's "just another workout"

The goal: Transform the athlete's relationship to hard/boring work 
so excellence becomes enjoyable, not just tolerable.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, List, Dict, Any


class ReframeType(Enum):
    """Types of cognitive reframes for aversive training."""
    CHALLENGE_SEEKING = "challenge"      # "This is hard" â†’ "This is where I grow"
    CURIOSITY = "curiosity"              # "Boring" â†’ "What can I notice/learn?"
    MASTERY_FOCUS = "mastery"            # "Suffering" â†’ "Perfecting my craft"
    PRESENT_MOMENT = "present"           # "2 hours to go" â†’ "Just this stroke"
    GRATITUDE = "gratitude"              # "I have to" â†’ "I get to"
    IDENTITY = "identity"                # "This sucks" â†’ "This is who I am"
    COMPETITION = "competition"          # "Alone" â†’ "Building my edge"


class AttentionAnchor(Enum):
    """Where to direct attention during monotonous work."""
    BREATH = "breath"                    # Rhythmic breathing patterns
    TECHNIQUE_MICRO = "technique_micro"  # One tiny technical element
    BODY_SCAN = "body_scan"              # Systematic body awareness
    COUNTING = "counting"                # Strokes, steps, pedals
    MANTRA = "mantra"                    # Repeated phrase
    ENVIRONMENT = "environment"          # External focus (nature, course)
    MUSIC_INTERNAL = "music_internal"    # Song in head, rhythm
    VISUALIZATION = "visualization"      # Seeing the race, the goal


@dataclass
class MentalSkillPrescription:
    """
    A specific mental skill to practice during a session.
    
    Just like "do 4x8min at threshold," this prescribes 
    "practice challenge-seeking reframe during the hard intervals."
    """
    skill_name: str
    description: str
    when_to_use: str                     # "During the 3rd and 4th interval"
    how_to_practice: str                 # Specific instructions
    success_indicator: str               # How to know you did it
    
    # Progression
    difficulty_level: int = 1            # 1-5, builds over time
    prerequisite_skills: List[str] = field(default_factory=list)


@dataclass  
class SessionMindset:
    """
    The mental approach prescribed for a specific session.
    
    Pairs with the physical prescription to create complete session guidance.
    """
    session_id: str
    session_type: str
    
    # The reframe
    default_narrative: str               # What most athletes think
    elite_narrative: str                 # How to think instead
    reframe_type: ReframeType
    
    # Attention strategy
    attention_anchor: AttentionAnchor
    attention_instruction: str           # Specific guidance
    
    # Shrinking the frame
    chunk_strategy: str                  # How to break it into mental pieces
    micro_goals: List[str]               # Small wins to target
    
    # Emotional preparation
    anticipation_reframe: str            # How to think about it beforehand
    post_session_reflection: str         # What to notice after
    
    # Skill to practice
    skill_prescription: Optional[MentalSkillPrescription] = None


class EmotionalSkillLibrary:
    """
    Library of mental skills and reframes that can be prescribed.
    
    These are the "techniques" of emotional regulation, just like 
    flip turns and streamlines are techniques of swimming.
    """
    
    @staticmethod
    def get_reframe(session_type: str, athlete_struggle: str = None) -> Dict[str, str]:
        """
        Get the appropriate reframe for a session type.
        
        Returns both the default (amateur) narrative and the 
        elite narrative to practice.
        """
        reframes = {
            "long_easy": {
                "default": "This is boring. 2 hours of nothing. When will it end?",
                "elite": "This is meditation in motion. Each minute builds my aerobic engine. I get to move my body for 2 hours while most people sit at desks.",
                "practice": "Every time you catch yourself clock-watching, return attention to your breath rhythm. Count 4 breaths, then notice one thing about your technique.",
            },
            "threshold": {
                "default": "This is going to hurt. I hate threshold work. I hope I can survive it.",
                "elite": "This is where I get faster. The discomfort is the adaptation signal. I'm buying fitness right now.",
                "practice": "When the burning starts, say internally: 'This is the money zone.' Focus on one technique cue to keep form as you fatigue.",
            },
            "vo2max": {
                "default": "These intervals are brutal. I can't breathe. Why do I do this?",
                "elite": "5 minutes of work, then rest. I can do anything for 5 minutes. This ceiling-raising work is rare and valuable.",
                "practice": "Break each interval into 1-minute chunks. At each minute, check: Am I still in control? Celebrate each chunk completed.",
            },
            "recovery": {
                "default": "This is too easy. I should be working harder. I'm losing fitness.",
                "elite": "This is when I absorb the work. Recovery IS training. My body is building what yesterday's session stimulated.",
                "practice": "Notice how your body feels. Find the sensations of recovery happening. This is active healing.",
            },
            "tempo": {
                "default": "Not hard enough to feel accomplished, not easy enough to relax. Purgatory.",
                "elite": "This is my race pace foundation. I'm teaching my body what sustainable effort feels like. Dialing in the feeling I'll need on race day.",
                "practice": "Focus on finding the exact effort you could hold for an hour. Not harder. The skill is precision, not suffering.",
            },
            "drills": {
                "default": "This is tedious. I already know how to swim/run/bike. Let's just train.",
                "elite": "This is where tiny improvements happen. The difference between good and great is in these details. I'm polishing my craft.",
                "practice": "Pick ONE thing to improve by 1%. Give it full attention. Feel the difference when you nail it.",
            },
            "race": {
                "default": "This is THE day. Everything is on the line. Don't screw up.",
                "elite": "This is just another workout - one I've rehearsed many times. Execute the plan. Nothing new, nothing special.",
                "practice": "In the days before: 'I've done this exact effort in training. Race day is repetition #5, not something new.'",
            },
        }
        
        return reframes.get(session_type, {
            "default": "I have to get through this.",
            "elite": "I get to do this. What can I learn here?",
            "practice": "Find one element to be curious about.",
        })
    
    @staticmethod
    def get_attention_strategy(session_type: str, duration_minutes: int) -> Dict[str, Any]:
        """
        Get attention management strategy for monotonous work.
        
        The enemy of enjoyment is mind-wandering to "how much longer?"
        The solution is giving the mind something valuable to do.
        """
        if duration_minutes > 90:
            return {
                "anchor": AttentionAnchor.TECHNIQUE_MICRO,
                "instruction": (
                    "Divide the session into 20-minute 'technique blocks.' Each block, "
                    "focus on ONE micro-element:\n"
                    "  Block 1: Breath timing\n"
                    "  Block 2: Foot strike / pedal stroke\n"
                    "  Block 3: Posture and alignment\n"
                    "  Block 4: Relaxed shoulders and hands\n"
                    "  Block 5: Cadence consistency\n"
                    "Rate yourself 1-10 on each element. Chase small improvements."
                ),
                "why_it_works": (
                    "Chunking transforms 'survive 2 hours' into 'get better at 5 things.' "
                    "The mind needs a job. Give it quality control duty."
                ),
            }
        elif session_type in ["threshold", "vo2max", "tempo"]:
            return {
                "anchor": AttentionAnchor.COUNTING,
                "instruction": (
                    "During hard efforts, count in small units:\n"
                    "  - Count to 30 breaths, then start over\n"
                    "  - Count 50 pedal strokes, then start over\n"
                    "  - Break intervals into thirds: 'First third, second third, last third'\n"
                    "Never count UP toward the end. Count loops."
                ),
                "why_it_works": (
                    "Counting loops keeps the mind in the present. "
                    "Counting up ('only 47 more seconds') creates anticipation and suffering. "
                    "Loops create rhythm and presence."
                ),
            }
        else:
            return {
                "anchor": AttentionAnchor.BODY_SCAN,
                "instruction": (
                    "Every 5 minutes, do a quick body scan:\n"
                    "  - Face and jaw: relaxed?\n"
                    "  - Shoulders: dropped?\n"
                    "  - Hands: light grip?\n"
                    "  - Breathing: rhythmic?\n"
                    "Release any tension you find. Reset to smooth."
                ),
                "why_it_works": (
                    "Tension accumulates unconsciously. Regular scans catch it early. "
                    "The scan also gives the mind a recurring task, preventing drift."
                ),
            }
    
    @staticmethod
    def get_enjoyment_builders(session_type: str) -> List[Dict[str, str]]:
        """
        Specific practices to BUILD enjoyment, not just tolerate discomfort.
        
        Chambliss found that elite swimmers don't just endure - they 
        genuinely find the work "peaceful, meditative, challenging, therapeutic."
        
        This is learned. Here's how to learn it.
        """
        universal = [
            {
                "practice": "Find the Craft",
                "instruction": (
                    "Identify ONE technical element you're trying to perfect. "
                    "Treat the session as a laboratory for that element. "
                    "You're not 'doing a workout' - you're refining your craft."
                ),
                "example": "Today I'm perfecting my catch. Every stroke is data.",
            },
            {
                "practice": "Sensation Curiosity", 
                "instruction": (
                    "Instead of labeling sensations as 'pain' or 'discomfort,' "
                    "get curious: Where exactly is it? Is it sharp or dull? "
                    "Does it change with technique adjustments? "
                    "Become a scientist studying your own body."
                ),
                "example": "My quads are burning. Interesting - is it both equally? What happens if I adjust my pedal stroke?",
            },
            {
                "practice": "Gratitude Anchors",
                "instruction": (
                    "Set 3 points in the session where you pause and note something "
                    "you're grateful for: your body, the environment, the opportunity. "
                    "This isn't toxic positivity - it's attention training."
                ),
                "example": "Mile 3: I'm grateful my legs work. Mile 6: I'm grateful for this trail. Mile 9: I'm grateful I have time to do this.",
            },
            {
                "practice": "Future Self Thanks",
                "instruction": (
                    "Visualize yourself on race day, drawing on the fitness you're "
                    "building RIGHT NOW. Your future self thanks your present self. "
                    "This rep matters to that person."
                ),
                "example": "In 10 weeks, I'll need this interval. I'm banking it now.",
            },
        ]
        
        type_specific = {
            "long_easy": [
                {
                    "practice": "Moving Meditation",
                    "instruction": (
                        "Treat this as meditation, not exercise. "
                        "Return to breath when the mind wanders. "
                        "The goal is presence, not pace. "
                        "Many people pay for meditation retreats; you get it free."
                    ),
                    "example": "This is my 2-hour meditation. Thoughts come and go. I return to my breath.",
                },
            ],
            "threshold": [
                {
                    "practice": "Buy the Burn",
                    "instruction": (
                        "Reframe lactate burn as currency. You're purchasing fitness. "
                        "Each second in the burn zone is a deposit in your race account. "
                        "You're not suffering - you're investing."
                    ),
                    "example": "This burn is expensive fitness. I'm buying what others won't.",
                },
            ],
            "vo2max": [
                {
                    "practice": "Temporary Visitor",
                    "instruction": (
                        "You're only visiting this pain cave - you don't live here. "
                        "5 minutes and you leave. The exit is guaranteed. "
                        "Be curious about what's here while you visit."
                    ),
                    "example": "I'm visiting 95% max HR for 4 minutes. Then I leave. Just visiting.",
                },
            ],
        }
        
        return universal + type_specific.get(session_type, [])


class MindsetPrescriptionEngine:
    """
    Generates mental skill prescriptions alongside physical prescriptions.
    
    Just as a coach prescribes "4x8min at threshold," this engine prescribes
    "practice challenge-seeking reframe with counting loops attention anchor."
    """
    
    def __init__(self):
        self.library = EmotionalSkillLibrary()
        self.skill_progression = self._init_skill_progression()
        
    def _init_skill_progression(self) -> Dict[str, List[str]]:
        """
        Define skill progressions - what to learn first, what builds on what.
        
        Like physical periodization, mental skills have progressions.
        """
        return {
            "foundation": [
                "breath_anchor",           # Learn to return attention to breath
                "body_scan",               # Learn to notice and release tension
                "counting_loops",          # Learn to stay present via counting
            ],
            "reframing": [
                "gratitude_shift",         # "Have to" â†’ "Get to"
                "challenge_seeking",       # "Hard" â†’ "Growth"
                "craft_focus",             # "Workout" â†’ "Practice"
            ],
            "advanced": [
                "sensation_curiosity",     # Pain as data, not threat
                "identity_anchor",         # "This is who I am"
                "race_normalization",      # "Just another workout"
            ],
            "mastery": [
                "flow_cultivation",        # Setting up conditions for flow
                "adversity_welcoming",     # Genuinely enjoying hard days
                "mundanity_embracing",     # Finding peace in repetition
            ],
        }
    
    def prescribe_for_session(
        self, 
        session_type: str, 
        duration_minutes: int,
        athlete_level: str = "developing",  # "beginner", "developing", "advanced", "mastery"
        specific_struggle: str = None,
    ) -> SessionMindset:
        """
        Generate complete mental prescription for a session.
        """
        # Get appropriate reframe
        reframe_data = self.library.get_reframe(session_type, specific_struggle)
        
        # Get attention strategy
        attention_data = self.library.get_attention_strategy(session_type, duration_minutes)
        
        # Get enjoyment builders
        enjoyment_practices = self.library.get_enjoyment_builders(session_type)
        
        # Determine skill to practice based on level
        skill_to_practice = self._select_skill_for_level(athlete_level, session_type)
        
        # Build chunk strategy
        chunk_strategy = self._build_chunk_strategy(session_type, duration_minutes)
        
        # Build micro-goals
        micro_goals = self._build_micro_goals(session_type)
        
        return SessionMindset(
            session_id="",  # Set by caller
            session_type=session_type,
            default_narrative=reframe_data["default"],
            elite_narrative=reframe_data["elite"],
            reframe_type=self._classify_reframe(session_type),
            attention_anchor=attention_data["anchor"],
            attention_instruction=attention_data["instruction"],
            chunk_strategy=chunk_strategy,
            micro_goals=micro_goals,
            anticipation_reframe=self._build_anticipation_reframe(session_type),
            post_session_reflection=self._build_reflection_prompt(session_type),
            skill_prescription=skill_to_practice,
        )
    
    def _select_skill_for_level(self, level: str, session_type: str) -> MentalSkillPrescription:
        """Select appropriate mental skill to practice based on athlete level."""
        skills = {
            "beginner": MentalSkillPrescription(
                skill_name="Breath Anchor",
                description="Return attention to breath when mind wanders",
                when_to_use="Whenever you notice you're thinking about how much longer",
                how_to_practice=(
                    "Count 4-count inhale, 4-count exhale. "
                    "When you lose count, start over without judgment. "
                    "The restart IS the practice."
                ),
                success_indicator="You noticed your mind wandering at least 5 times and returned each time",
                difficulty_level=1,
            ),
            "developing": MentalSkillPrescription(
                skill_name="Challenge Reframe",
                description="Transform 'this is hard' into 'this is where I grow'",
                when_to_use="When you feel the urge to back off or quit",
                how_to_practice=(
                    "When discomfort peaks, say internally: 'This is the money zone.' "
                    "Then find ONE technique cue to focus on. "
                    "Hard + focused = growth. Hard + unfocused = just suffering."
                ),
                success_indicator="You used the phrase at least 3 times and found a technique focus each time",
                difficulty_level=2,
                prerequisite_skills=["breath_anchor"],
            ),
            "advanced": MentalSkillPrescription(
                skill_name="Sensation Curiosity",
                description="Approach discomfort with curiosity instead of resistance",
                when_to_use="During sustained hard efforts",
                how_to_practice=(
                    "When you feel 'pain,' get specific: Where exactly? Sharp or dull? "
                    "Constant or pulsing? Does it change with technique? "
                    "You're a scientist. The sensation is data."
                ),
                success_indicator="You can describe the sensation in detail without the word 'pain'",
                difficulty_level=3,
                prerequisite_skills=["breath_anchor", "challenge_reframe"],
            ),
            "mastery": MentalSkillPrescription(
                skill_name="Mundanity Embracing",
                description="Find genuine peace and enjoyment in repetitive work",
                when_to_use="During long, monotonous sessions",
                how_to_practice=(
                    "Instead of waiting for it to end, look for what's enjoyable RIGHT NOW. "
                    "The rhythm. The movement. The environment. The privilege. "
                    "If you can't find enjoyment, find peace. If you can't find peace, find acceptance."
                ),
                success_indicator="You experienced at least one moment of genuine enjoyment or peace",
                difficulty_level=4,
                prerequisite_skills=["breath_anchor", "challenge_reframe", "sensation_curiosity"],
            ),
        }
        
        return skills.get(level, skills["developing"])
    
    def _classify_reframe(self, session_type: str) -> ReframeType:
        """Classify the primary reframe type for a session."""
        mappings = {
            "long_easy": ReframeType.PRESENT_MOMENT,
            "threshold": ReframeType.CHALLENGE_SEEKING,
            "vo2max": ReframeType.CHALLENGE_SEEKING,
            "tempo": ReframeType.MASTERY_FOCUS,
            "recovery": ReframeType.GRATITUDE,
            "drills": ReframeType.CURIOSITY,
            "race": ReframeType.IDENTITY,
        }
        return mappings.get(session_type, ReframeType.CHALLENGE_SEEKING)
    
    def _build_chunk_strategy(self, session_type: str, duration_minutes: int) -> str:
        """Build mental chunking strategy for the session."""
        if duration_minutes > 120:
            return (
                f"Divide into {duration_minutes // 30} x 30-minute blocks. "
                "Each block has a theme:\n"
                "  Block 1: Settle in, find rhythm\n"
                "  Block 2: Technique focus\n"
                "  Block 3: Body awareness\n"
                "  Block 4: Gratitude/presence\n"
                "  Final block: Strong finish\n"
                "Never think about total duration. Only this block."
            )
        elif duration_minutes > 60:
            return (
                "Divide into thirds:\n"
                "  First third: Settle, smooth, patient\n"
                "  Middle third: Technique focus zone\n"
                "  Final third: Build toward strong finish\n"
                "Only think about which third you're in."
            )
        else:
            return (
                "For shorter sessions, divide into the workout structure itself. "
                "Warmup â†’ Main set â†’ Cooldown. "
                "During main set, each interval is its own complete event."
            )
    
    def _build_micro_goals(self, session_type: str) -> List[str]:
        """Build small, achievable micro-goals for the session."""
        universal = [
            "Return to breath anchor at least 5 times",
            "Do one body scan and release tension",
            "Notice one moment of enjoyment or flow",
        ]
        
        type_specific = {
            "long_easy": [
                "Keep RPE at conversational pace throughout",
                "Find 3 things to be grateful for during the session",
                "End with a smile and say 'that was good'",
            ],
            "threshold": [
                "Hold target power for the full interval on at least 3 of them",
                "Use the 'money zone' reframe at least twice",
                "Maintain technique focus even when fatigued",
            ],
            "vo2max": [
                "Stay in the interval mentally (don't count down)",
                "Find one moment of 'I can do this' during each hard effort",
                "Notice how quickly you recover between intervals",
            ],
            "recovery": [
                "Stay truly easy - resist the urge to push",
                "Notice sensations of recovery happening",
                "End feeling better than you started",
            ],
        }
        
        return universal + type_specific.get(session_type, [])
    
    def _build_anticipation_reframe(self, session_type: str) -> str:
        """Build the reframe for anticipating the session (night before, morning of)."""
        reframes = {
            "long_easy": (
                "Tomorrow's long session is moving meditation. "
                "You get 2+ hours of uninterrupted time in your body. "
                "Most people don't get this. You do."
            ),
            "threshold": (
                "Tomorrow's threshold work is where you get faster. "
                "The discomfort is the signal that adaptation is happening. "
                "You're not dreading pain - you're anticipating growth."
            ),
            "vo2max": (
                "Tomorrow's VO2max session is short and valuable. "
                "A few minutes of hard work that raises your ceiling. "
                "You can do anything for 5 minutes."
            ),
            "recovery": (
                "Tomorrow is recovery - training through rest. "
                "Your body builds fitness during recovery, not during work. "
                "Easy is easy. Earn the recovery."
            ),
            "race": (
                "Race day is just repetition #5 of what you've practiced. "
                "Nothing new. Execute the plan you know. "
                "It's just another workout with a timing chip."
            ),
        }
        return reframes.get(session_type, "Tomorrow is an opportunity to practice your craft.")
    
    def _build_reflection_prompt(self, session_type: str) -> str:
        """Build post-session reflection prompt."""
        return (
            "After the session, note:\n"
            "1. Did you practice the mental skill? How did it go?\n"
            "2. Was there a moment of flow, enjoyment, or peace?\n"
            "3. What made it easier? What made it harder?\n"
            "4. One word to describe the session.\n"
            "5. What will you do the same/differently next time?"
        )
    
    def generate_race_normalization_plan(
        self, 
        race_name: str, 
        race_date: datetime, 
        race_duration_hours: float
    ) -> List[Dict[str, Any]]:
        """
        Generate a plan to make race day feel mundane.
        
        Chambliss: "Winners don't choke. They take the Olympics as 
        'just another swim meet.'"
        
        This is achieved through deliberate simulation and reframing.
        """
        days_out = (race_date - datetime.now()).days
        
        plan = []
        
        # Dress rehearsals (physical simulations)
        if days_out > 28:
            plan.append({
                "week": -4,
                "type": "dress_rehearsal",
                "instruction": (
                    f"Full race simulation at 85% of race duration ({race_duration_hours * 0.85:.1f} hrs). "
                    "Wear race kit. Use race nutrition. Start at race time of day. "
                    "Practice pre-race routine exactly."
                ),
                "mental_focus": "This IS the race. Just shorter. Same feeling, same execution.",
            })
            
        if days_out > 14:
            plan.append({
                "week": -2,
                "type": "dress_rehearsal",
                "instruction": (
                    f"Race simulation at 70% duration ({race_duration_hours * 0.7:.1f} hrs). "
                    "Final dress rehearsal. Everything as it will be on race day."
                ),
                "mental_focus": "Repetition #2. Race day will be #3. Nothing new.",
            })
        
        # Race-pace sessions (intensity simulations)
        plan.append({
            "week": -3,
            "type": "race_pace",
            "instruction": "30-40 minutes at goal race pace/power. Feel what race day will feel like.",
            "mental_focus": "This is the exact effort you'll hold. You've done it. You can do it.",
        })
        
        plan.append({
            "week": -1,
            "type": "opener",
            "instruction": "15-20 minutes easy with 3x30sec at race pace. Activation, not depletion.",
            "mental_focus": "The engine is ready. You've touched race pace. Body knows what to do.",
        })
        
        # Mental rehearsals
        plan.append({
            "timing": "Daily, last 2 weeks",
            "type": "visualization",
            "instruction": (
                "5 minutes daily: Visualize race morning, start, middle, finish. "
                "See yourself calm, executing, managing problems that arise. "
                "Feel the boredom of the middle miles. See yourself pushing through."
            ),
            "mental_focus": "You've 'done' this race 14 times in your head before you toe the line.",
        })
        
        # Reframe mantras
        plan.append({
            "timing": "Race week",
            "type": "mantra_practice",
            "mantras": [
                "Just another workout",
                "I've done this before",
                "Execute the plan",
                "Nothing new on race day",
                "This is repetition #N",
            ],
            "instruction": "Pick 2-3 mantras. Use them when you feel anxiety rising.",
        })
        
        # Race morning protocol
        plan.append({
            "timing": "Race morning",
            "type": "race_morning_protocol",
            "instruction": (
                "1. Wake at normal training time\n"
                "2. Eat normal pre-long-session breakfast\n"
                "3. Arrive at venue - it's just a training location\n"
                "4. Warm up exactly as you have in training\n"
                "5. At the start: 'Repetition begins now'\n"
                "\nNothing is different. This is Tuesday's workout with a bib number."
            ),
        })
        
        return plan


def integrate_with_session(physical_prescription: Dict, athlete_level: str = "developing") -> Dict:
    """
    Integrate mental prescription with physical prescription.
    
    This is how it joins with the training_plan.py module.
    """
    engine = MindsetPrescriptionEngine()
    
    session_type = physical_prescription.get("type", "threshold")
    duration = physical_prescription.get("duration_minutes", 60)
    
    mindset = engine.prescribe_for_session(
        session_type=session_type,
        duration_minutes=duration,
        athlete_level=athlete_level,
    )
    
    # Combine physical and mental prescription
    return {
        "physical": physical_prescription,
        "mental": {
            "default_narrative": mindset.default_narrative,
            "elite_narrative": mindset.elite_narrative,
            "attention_strategy": mindset.attention_instruction,
            "chunk_strategy": mindset.chunk_strategy,
            "micro_goals": mindset.micro_goals,
            "skill_to_practice": {
                "name": mindset.skill_prescription.skill_name,
                "how": mindset.skill_prescription.how_to_practice,
                "success": mindset.skill_prescription.success_indicator,
            } if mindset.skill_prescription else None,
            "anticipation": mindset.anticipation_reframe,
            "reflection_prompt": mindset.post_session_reflection,
        },
    }


# Example usage and output
def demo_mindset_prescription():
    """Show what a complete session prescription looks like."""
    
    physical = {
        "type": "threshold",
        "duration_minutes": 70,
        "description": "4x10min at 88-92% FTP, 3min recovery",
        "target_power": "235-245W",
    }
    
    complete = integrate_with_session(physical, athlete_level="developing")
    
    print("=" * 70)
    print("COMPLETE SESSION PRESCRIPTION")
    print("=" * 70)
    print()
    print("PHYSICAL:")
    print(f"  {complete['physical']['description']}")
    print(f"  Target: {complete['physical']['target_power']}")
    print()
    print("MENTAL:")
    print()
    print("  What most athletes think:")
    print(f"    \"{complete['mental']['default_narrative']}\"")
    print()
    print("  What elite athletes think:")
    print(f"    \"{complete['mental']['elite_narrative']}\"")
    print()
    print("  Attention strategy:")
    print(f"    {complete['mental']['attention_strategy']}")
    print()
    print("  Chunking strategy:")
    print(f"    {complete['mental']['chunk_strategy']}")
    print()
    print("  Micro-goals for the session:")
    for goal in complete['mental']['micro_goals']:
        print(f"    â€¢ {goal}")
    print()
    print("  Mental skill to practice:")
    print(f"    {complete['mental']['skill_to_practice']['name']}")
    print(f"    How: {complete['mental']['skill_to_practice']['how']}")
    print(f"    Success: {complete['mental']['skill_to_practice']['success']}")
    print()
    print("  Night-before reframe:")
    print(f"    \"{complete['mental']['anticipation']}\"")
    print()
    print("=" * 70)


if __name__ == "__main__":
    demo_mindset_prescription()
