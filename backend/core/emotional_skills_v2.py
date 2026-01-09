"""
Emotional Skill Development Module v2.0
=======================================
Revised with authentic language from elite athletes and coaches.

Sources integrated:
- Kobe Bryant (Mamba Mentality)
- Michael Jordan (Failure as growth, mental toughness)
- Tim Grover (Relentless philosophy)
- Phil Jackson (Zen coaching, present-moment focus)
- Pat Riley (Disease of Me, sacrifice)
- Curt Cignetti (One-game season, process focus)
- Elite endurance athletes (Pain reframing, mantras, chunking)

Core insight from Chambliss remains: Elite performers don't just TOLERATE
what others find boring/hard - they genuinely ENJOY it. But now we use
the actual language and mental frameworks these athletes employ.

Key additions:
- "Failure is data" (MJ's 9,000 missed shots philosophy)
- "Comfortable being uncomfortable" (Grover)
- "What we resist persists" (Jackson)
- "One-game season" mentality (Cignetti)
- "Pain as information" (Dauwalter)
- "Don't think. You already know." (Grover)
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, List, Dict, Any


class ReframeType(Enum):
    """Types of cognitive reframes for aversive training."""
    MAMBA_MENTALITY = "mamba"             # Obsessive craft refinement (Kobe)
    FAILURE_AS_DATA = "failure_data"      # Mistakes are information (MJ)
    RELENTLESS = "relentless"             # Comfortable being uncomfortable (Grover)
    ZEN_PRESENCE = "zen_presence"         # Present moment, accept flux (Jackson)
    IDENTITY_ANCHOR = "identity"          # "This is who I am" (multiple)
    ONE_GAME_SEASON = "one_game"          # This game is the only game (Cignetti)
    PAIN_AS_INFORMATION = "pain_info"     # Sensation curiosity (Dauwalter)
    SACRIFICE_FOR_GREATER = "sacrifice"   # Give up now for later (Riley)


class AttentionAnchor(Enum):
    """Where to direct attention during monotonous work."""
    BREATH_RHYTHM = "breath"              # Rhythmic breathing patterns
    TECHNIQUE_OBSESSION = "technique"     # Kobe's "one detail" focus
    BODY_DATA = "body_data"               # Sensation as information
    COUNTING_LOOPS = "counting"           # Never count up, only loops
    MANTRA = "mantra"                     # "Strong. Calm. Confident." style
    NEXT_REP = "next_rep"                 # Only this rep exists
    CRAFT_REFINEMENT = "craft"            # "1% better at one thing"


class MentalArchetype(Enum):
    """
    Mental archetypes based on elite athlete patterns.
    
    Athletes can identify with one or blend multiple.
    """
    CRAFTSMAN = "craftsman"       # Kobe: obsessive detail refinement
    COMPETITOR = "competitor"     # MJ: use everything as fuel
    ZEN_WARRIOR = "zen_warrior"   # Jackson athletes: present, accepting
    RELENTLESS = "relentless"     # Grover's "Cleaners": just do, don't think
    PROCESS_MASTER = "process"    # Cignetti: one game at a time


# =============================================================================
# AUTHENTIC QUOTES & MANTRAS DATABASE
# =============================================================================

ELITE_QUOTES = {
    "failure": {
        "jordan_9000": "I've missed more than 9,000 shots. Lost almost 300 games. 26 times I've been trusted to take the game-winning shot and missed. I've failed over and over in my life. And that is why I succeed.",
        "jordan_learn": "To learn to succeed, you must first learn to fail.",
        "jordan_get_up": "It doesn't matter if you fall down, it's whether you get back up.",
        "kobe_obsession": "I have nothing in common with lazy people who blame others for their lack of success.",
    },
    "work_ethic": {
        "jordan_work": "I've always believed that if you put in the work, the results will come.",
        "jordan_no_shortcuts": "If you do the work, you get rewarded. There are no shortcuts in life.",
        "kobe_detail": "I focus on one small detail and obsess over it. When I master it, I pick the next.",
        "grover_craving": "Being relentless means craving the end result so intensely that the work becomes irrelevant.",
    },
    "mental_toughness": {
        "grover_comfortable": "If you want success of any kind: you have to be comfortable being uncomfortable.",
        "grover_dont_think": "Don't think. You already know what you have to do, and you know how to do it. What's stopping you?",
        "grover_mind_body": "Physical dominance can make you great. Mental dominance is what ultimately makes you unstoppable.",
        "jordan_obstacles": "Obstacles don't have to stop you. If you run into a wall, don't turn around and give up. Figure out how to climb it, go through it, or work around it.",
        "kobe_flinch": "Why should I flinch? I don't acknowledge your attempts to get under my skin.",
    },
    "present_moment": {
        "jackson_chop_wood": "Before enlightenment, chop wood, carry water. After enlightenment, chop wood, carry water.",
        "jackson_flux": "Everything is always in flux. Until you accept this, you won't be able to find true equanimity.",
        "jackson_resist": "What we resist persists.",
        "jackson_joy": "True joy comes from being fully present in each and every moment, not just when things are going your way.",
        "cignetti_feet": "Be where your feet are and make the most of every moment.",
    },
    "process": {
        "cignetti_one_game": "It's a one-game season.",
        "cignetti_stack": "Stack those moments, meetings, and practices.",
        "riley_excellence": "Excellence is the gradual result of always striving to do better.",
        "riley_no_excuses": "There's no such thing as coulda, shoulda, or woulda. If you shoulda and coulda, you woulda done it.",
    },
    "sacrifice": {
        "riley_sacrifice": "Willing sacrifice is the great paradox. You must give up something in the immediate present to attract something even better in the future.",
        "riley_commitment": "There are only two options regarding commitment. You're either in or out. There's no such thing as a life in between.",
        "jackson_me_we": "Good teams become great ones when the members trust each other enough to surrender the 'Me' for the 'We.'",
    },
    "pain_reframe": {
        "dauwalter_info": "I don't view pain as suffering. I see it as information. Sometimes that information is just telling me I'm working hard, which is exactly what I came to do.",
        "feelings_ephemeral": "Feelings are real but they are creations based on past experience. They are as ephemeral as clouds on a summer day.",
        "pain_visitor": "Know it will pass. The discomfort is temporary, and each step forward is one closer to the finish.",
    },
    "confidence": {
        "jordan_expect": "You have to expect things of yourself before you can do them.",
        "jordan_never_lost": "I've never lost a game. I just ran out of time.",
        "kobe_job_done": "The game isn't over until the job is done.",
        "cignetti_google": "I win. Google me.",
    },
}

ELITE_MANTRAS = {
    "endurance": [
        "Strong. Calm. Confident.",           # Kellyn Taylor
        "Relaxed fast. Relaxed fast.",        # Running coaches
        "Pain is temporary. Results are forever.",
        "I can do hard things.",
        "This will pass.",
    ],
    "intensity": [
        "This is where I get better.",
        "Earn it.",
        "One more. Just one more.",
        "I've done this before.",
        "Don't think. Do.",                   # Grover-inspired
    ],
    "competition": [
        "Be where your feet are.",            # Cignetti
        "Execute the process.",
        "Next play.",
        "I win.",
        "Job's not finished.",                # Kobe
    ],
    "recovery": [
        "Recovery is training.",
        "Absorb the work.",
        "Building what yesterday started.",
        "Trust the process.",
    ],
}


@dataclass
class MentalSkillPrescription:
    """
    A specific mental skill to practice during a session.
    
    Just like "do 4x8min at threshold," this prescribes 
    "practice the Grover 'don't think' approach during hard intervals."
    """
    skill_name: str
    source_inspiration: str               # Which athlete/coach this comes from
    description: str
    when_to_use: str
    how_to_practice: str
    key_phrase: str                       # The internal cue to use
    success_indicator: str
    
    difficulty_level: int = 1             # 1-5, builds over time
    prerequisite_skills: List[str] = field(default_factory=list)


@dataclass
class SessionMindset:
    """
    The mental approach prescribed for a specific session.
    
    Pairs with the physical prescription to create complete session guidance.
    """
    session_id: str
    session_type: str
    
    # The reframe (using authentic language)
    amateur_narrative: str                # What untrained mind thinks
    elite_narrative: str                  # How elite athletes frame it
    source_quote: str                     # Actual quote that captures this
    source_attribution: str               # Who said it
    reframe_type: ReframeType
    
    # Attention strategy
    attention_anchor: AttentionAnchor
    attention_instruction: str
    
    # Mental chunking
    chunk_strategy: str
    micro_goals: List[str]
    
    # Mantras to use
    suggested_mantras: List[str]
    
    # Pre/post session
    anticipation_reframe: str
    post_session_reflection: str
    
    skill_prescription: Optional[MentalSkillPrescription] = None


class EliteMindsetLibrary:
    """
    Library of mental skills and reframes derived from elite athletes.
    
    Key principle: These aren't generic coaching platitudes. They're 
    documented mental approaches from athletes who performed at the 
    highest levels under the most pressure.
    """
    
    @staticmethod
    def get_reframe(session_type: str, athlete_struggle: str = None) -> Dict[str, Any]:
        """
        Get the appropriate reframe for a session type using authentic language.
        """
        reframes = {
            "long_easy": {
                "amateur": "This is boring. 2 hours of nothing. When will it end?",
                "elite": "This is moving meditation. Before enlightenment, chop wood. After enlightenment, chop wood. The task doesn't changeâ€”my presence in it does.",
                "quote": ELITE_QUOTES["present_moment"]["jackson_chop_wood"],
                "attribution": "Phil Jackson",
                "practice": (
                    "When your mind wanders to 'how much longer,' use Jackson's insight: "
                    "return to the task itself. The task is the destination. "
                    "What can you notice about THIS pedal stroke? THIS breath?"
                ),
                "reframe_type": ReframeType.ZEN_PRESENCE,
            },
            "threshold": {
                "amateur": "This is going to hurt. I hate threshold work. I hope I can survive it.",
                "elite": "This discomfort is information telling me I'm working hardâ€”which is exactly what I came to do. The burn is the adaptation signal. I'm purchasing fitness.",
                "quote": ELITE_QUOTES["pain_reframe"]["dauwalter_info"],
                "attribution": "Courtney Dauwalter",
                "practice": (
                    "When the burn builds, don't resist it. Dauwalter's key: "
                    "treat sensation as data, not suffering. Get curious: "
                    "Where is it? What's its quality? This curiosity short-circuits the 'make it stop' reflex."
                ),
                "reframe_type": ReframeType.PAIN_AS_INFORMATION,
            },
            "vo2max": {
                "amateur": "These intervals are brutal. I can't breathe. Why do I do this?",
                "elite": "Don't think. I already know what I have to do and how to do it. Physical dominance makes you great. Mental dominance makes you unstoppable.",
                "quote": ELITE_QUOTES["mental_toughness"]["grover_dont_think"],
                "attribution": "Tim Grover",
                "practice": (
                    "Grover trained MJ and Kobe with this: stop thinking, start doing. "
                    "You've done these intervals before. Your body knows. "
                    "Thinking creates doubt. Just execute. One rep at a time."
                ),
                "reframe_type": ReframeType.RELENTLESS,
            },
            "recovery": {
                "amateur": "This is too easy. I should be working harder. I'm losing fitness.",
                "elite": "Everything is always in flux. Recovery IS the training. My body is building what yesterday's session stimulated. Patience with the process.",
                "quote": ELITE_QUOTES["present_moment"]["jackson_flux"],
                "attribution": "Phil Jackson",
                "practice": (
                    "Accept that fitness isn't built during workâ€”it's built during recovery. "
                    "Jackson's Zen teaching: everything changes. Today's easy creates tomorrow's capacity. "
                    "Fighting this is resisting reality."
                ),
                "reframe_type": ReframeType.ZEN_PRESENCE,
            },
            "tempo": {
                "amateur": "Not hard enough to feel accomplished, not easy enough to relax.",
                "elite": "Excellence is the gradual result of always striving to do better. This tempo work is me perfecting the effort I'll need on race day. Precision, not suffering.",
                "quote": ELITE_QUOTES["process"]["riley_excellence"],
                "attribution": "Pat Riley",
                "practice": (
                    "Riley's insight: excellence is gradual. This session isn't about pain toleranceâ€” "
                    "it's about calibrating effort. Find the exact sustainable intensity. "
                    "That's the skill. Master the feel."
                ),
                "reframe_type": ReframeType.SACRIFICE_FOR_GREATER,
            },
            "drills": {
                "amateur": "This is tedious. I already know how to do this. Let's just train.",
                "elite": "I focus on one small detail and obsess over it. When I master it, I pick the next. The details are where championships are won.",
                "quote": ELITE_QUOTES["work_ethic"]["kobe_detail"],
                "attribution": "Kobe Bryant",
                "practice": (
                    "Kobe's Mamba Mentality: obsess over one micro-detail. "
                    "Not 'practice drills'â€”master THIS element. "
                    "Feel the difference between good and perfect. "
                    "That gap is where you live today."
                ),
                "reframe_type": ReframeType.MAMBA_MENTALITY,
            },
            "race": {
                "amateur": "This is THE day. Everything is on the line. Don't screw up.",
                "elite": "It's a one-game season. This is the only game that exists. I've done this exact effort in training. Nothing new. Execute the process.",
                "quote": ELITE_QUOTES["process"]["cignetti_one_game"],
                "attribution": "Curt Cignetti",
                "practice": (
                    "Cignetti transformed Indiana football with this: every game is THE game. "
                    "Not because it's specialâ€”because it's the only one you can play right now. "
                    "Race day is just Tuesday's workout with a bib number."
                ),
                "reframe_type": ReframeType.ONE_GAME_SEASON,
            },
            "failed_workout": {
                "amateur": "I blew it. I'm not fit enough. All that training for nothing.",
                "elite": "I've failed over and over in my life. And that is why I succeed. This missed workout is data, not judgment. What does it teach me?",
                "quote": ELITE_QUOTES["failure"]["jordan_9000"],
                "attribution": "Michael Jordan",
                "practice": (
                    "Jordan's 9,000 missed shots weren't failuresâ€”they were the price of 6 championships. "
                    "This 'failed' session isn't evidence you can't. "
                    "It's information about what you need. Learn from it. Adjust. Go again."
                ),
                "reframe_type": ReframeType.FAILURE_AS_DATA,
            },
        }
        
        return reframes.get(session_type, {
            "amateur": "I have to get through this.",
            "elite": "Be where your feet are. Make the most of this moment.",
            "quote": ELITE_QUOTES["present_moment"]["cignetti_feet"],
            "attribution": "Curt Cignetti",
            "practice": "Find one element to master. Stack this moment on the last.",
            "reframe_type": ReframeType.ONE_GAME_SEASON,
        })
    
    @staticmethod
    def get_attention_strategy(session_type: str, duration_minutes: int) -> Dict[str, Any]:
        """
        Get attention management strategy using elite athlete techniques.
        """
        if duration_minutes > 90:
            return {
                "anchor": AttentionAnchor.CRAFT_REFINEMENT,
                "instruction": (
                    "Use Kobe's 'one detail obsession' approach:\n"
                    "  - Pick ONE micro-element per 20-minute block\n"
                    "  - Block 1: Breath rhythm and timing\n"
                    "  - Block 2: Foot strike or pedal mechanics\n"
                    "  - Block 3: Posture and core engagement\n"
                    "  - Block 4: Arm carriage / hand position\n"
                    "  - Block 5: Cadence and rhythm\n\n"
                    "Each block, ask: 'Am I 1% better at this than 20 minutes ago?'\n"
                    "This transforms 'survive 2 hours' into 'master 5 things.'"
                ),
                "why_it_works": (
                    "Kobe would work on one move for hours. The obsession with detail "
                    "prevents boredom because you're always hunting improvement. "
                    "The mind needs a job. Give it craftsmanship."
                ),
            }
        elif session_type in ["threshold", "vo2max"]:
            return {
                "anchor": AttentionAnchor.NEXT_REP,
                "instruction": (
                    "Use Grover's 'don't think' approach:\n"
                    "  - This interval is the ONLY interval\n"
                    "  - Don't count total remainingâ€”that creates dread\n"
                    "  - When it ends, the next one becomes the only one\n"
                    "  - 'Don't think. You already know what to do.'\n\n"
                    "If you catch yourself projecting ('only 3 more'), reset:\n"
                    "'There is only this one. Then we'll see.'"
                ),
                "why_it_works": (
                    "Grover found that MJ and Kobe's edge wasn't thinking harderâ€” "
                    "it was thinking less. Analysis paralysis kills. "
                    "Trust the preparation. Execute."
                ),
            }
        elif session_type == "tempo":
            return {
                "anchor": AttentionAnchor.BODY_DATA,
                "instruction": (
                    "Use Dauwalter's 'sensation as information' approach:\n"
                    "  - Continuously monitor effort level as data\n"
                    "  - Not 'this hurts' but 'effort is at 7/10'\n"
                    "  - Adjust to find sustainable intensity\n"
                    "  - The skill is precision calibration\n\n"
                    "Ask every few minutes: 'Could I hold this for an hour?'\n"
                    "If no, back off 3%. If yes easily, add 2%."
                ),
                "why_it_works": (
                    "Dauwalter runs 200+ mile races by treating all sensation as "
                    "information rather than threat. Tempo requires the same: "
                    "you're calibrating, not suffering."
                ),
            }
        else:
            return {
                "anchor": AttentionAnchor.BREATH_RHYTHM,
                "instruction": (
                    "Use Jackson's 'chop wood, carry water' presence:\n"
                    "  - Return to breath whenever mind wanders\n"
                    "  - Don't judge the wanderingâ€”just return\n"
                    "  - Count breath cycles (4 in, 4 out)\n"
                    "  - When you lose count, start over\n\n"
                    "The return IS the practice. You're building the muscle "
                    "of present-moment attention."
                ),
                "why_it_works": (
                    "Jackson's Bulls and Lakers practiced meditation. "
                    "The ability to stay present under pressure came from "
                    "thousands of returns to breath in practice."
                ),
            }
    
    @staticmethod
    def get_mantras_for_session(session_type: str) -> List[str]:
        """Get appropriate mantras for the session type."""
        if session_type in ["long_easy", "endurance"]:
            return ELITE_MANTRAS["endurance"]
        elif session_type in ["threshold", "vo2max", "tempo"]:
            return ELITE_MANTRAS["intensity"]
        elif session_type == "race":
            return ELITE_MANTRAS["competition"]
        elif session_type == "recovery":
            return ELITE_MANTRAS["recovery"]
        else:
            return ["Be where your feet are.", "One rep at a time.", "I can do hard things."]
    
    @staticmethod
    def get_enjoyment_builders(session_type: str) -> List[Dict[str, str]]:
        """
        Specific practices to BUILD enjoyment using elite athlete frameworks.
        """
        universal = [
            {
                "practice": "Mamba Detail Hunt",
                "instruction": (
                    "Pick ONE technical element to improve by 1%. "
                    "Kobe would work on a single move until it was perfect. "
                    "What's your 'move' today? Hunt tiny improvements."
                ),
                "source": "Kobe Bryant",
            },
            {
                "practice": "Sensation Scientist",
                "instruction": (
                    "Don't label sensations as 'pain.' Get curious like Dauwalter: "
                    "Where is it exactly? Sharp or dull? Changing or constant? "
                    "You're collecting data about your body under load."
                ),
                "source": "Courtney Dauwalter",
            },
            {
                "practice": "Stack the Moments",
                "instruction": (
                    "Cignetti's philosophy: stack moments, practices, games. "
                    "Each rep stacks on the last. Each session builds the next. "
                    "You're not 'getting through'â€”you're building."
                ),
                "source": "Curt Cignetti",
            },
            {
                "practice": "Future Self Investment",
                "instruction": (
                    "Riley's sacrifice principle: give up comfort now for results later. "
                    "Visualize race day you drawing on THIS session. "
                    "You're making a deposit that future you will withdraw."
                ),
                "source": "Pat Riley",
            },
        ]
        
        type_specific = {
            "long_easy": [
                {
                    "practice": "Moving Enlightenment",
                    "instruction": (
                        "Jackson's Zen: the task before AND after enlightenment is the same. "
                        "Chopping wood, carrying waterâ€”or pedaling, running. "
                        "The difference is presence. Can you be fully HERE for 2 hours?"
                    ),
                    "source": "Phil Jackson",
                },
            ],
            "threshold": [
                {
                    "practice": "Buy the Burn (Relentless Edition)",
                    "instruction": (
                        "Grover's athletes craved the result so intensely that the work became irrelevant. "
                        "This burn is the currency. You're purchasing what your competitors won't. "
                        "Comfortable being uncomfortable."
                    ),
                    "source": "Tim Grover",
                },
            ],
            "vo2max": [
                {
                    "practice": "Don't Think Protocol",
                    "instruction": (
                        "Grover to his athletes: 'Don't think. You already know.' "
                        "Your body has done these intervals before. Trust it. "
                        "Thinking creates hesitation. Execution creates results."
                    ),
                    "source": "Tim Grover",
                },
            ],
            "race": [
                {
                    "practice": "One-Game Season",
                    "instruction": (
                        "Cignetti transformed a losing program by making every game THE game. "
                        "Not specialâ€”singular. This race is the only race that exists right now. "
                        "All your focus, no projection forward or back."
                    ),
                    "source": "Curt Cignetti",
                },
            ],
        }
        
        return universal + type_specific.get(session_type, [])


class MindsetPrescriptionEngine:
    """
    Generates mental skill prescriptions using elite athlete frameworks.
    """
    
    def __init__(self):
        self.library = EliteMindsetLibrary()
        self.skill_progression = self._init_skill_progression()
    
    def _init_skill_progression(self) -> Dict[str, List[str]]:
        """
        Define skill progressions based on how elite athletes develop mentally.
        """
        return {
            "foundation": [
                "breath_return",           # Jackson's meditation basics
                "body_data_collection",    # Dauwalter's sensation curiosity
                "single_rep_focus",        # Grover's 'only this one'
            ],
            "reframing": [
                "failure_as_data",         # Jordan's 9,000 shots
                "pain_as_information",     # Dauwalter's approach
                "sacrifice_for_future",    # Riley's paradox
            ],
            "advanced": [
                "mamba_obsession",         # Kobe's detail focus
                "relentless_execution",    # Grover's 'don't think'
                "one_game_presence",       # Cignetti's singular focus
            ],
            "mastery": [
                "zen_acceptance",          # Jackson's 'what we resist persists'
                "mundanity_as_craft",      # Chambliss + Kobe
                "identity_anchor",         # "This is who I am"
            ],
        }
    
    def prescribe_for_session(
        self,
        session_type: str,
        duration_minutes: int,
        athlete_level: str = "developing",
        specific_struggle: str = None,
    ) -> SessionMindset:
        """
        Generate complete mental prescription for a session.
        """
        reframe_data = self.library.get_reframe(session_type, specific_struggle)
        attention_data = self.library.get_attention_strategy(session_type, duration_minutes)
        mantras = self.library.get_mantras_for_session(session_type)
        skill = self._select_skill_for_level(athlete_level, session_type)
        chunk_strategy = self._build_chunk_strategy(session_type, duration_minutes)
        micro_goals = self._build_micro_goals(session_type)
        
        return SessionMindset(
            session_id="",
            session_type=session_type,
            amateur_narrative=reframe_data["amateur"],
            elite_narrative=reframe_data["elite"],
            source_quote=reframe_data["quote"],
            source_attribution=reframe_data["attribution"],
            reframe_type=reframe_data["reframe_type"],
            attention_anchor=attention_data["anchor"],
            attention_instruction=attention_data["instruction"],
            chunk_strategy=chunk_strategy,
            micro_goals=micro_goals,
            suggested_mantras=mantras[:3],
            anticipation_reframe=self._build_anticipation_reframe(session_type),
            post_session_reflection=self._build_reflection_prompt(session_type),
            skill_prescription=skill,
        )
    
    def _select_skill_for_level(self, level: str, session_type: str) -> MentalSkillPrescription:
        """Select appropriate mental skill based on athlete level."""
        skills = {
            "beginner": MentalSkillPrescription(
                skill_name="Breath Return",
                source_inspiration="Phil Jackson / Zen Buddhism",
                description="Return attention to breath when mind wanders",
                when_to_use="Whenever you notice you're projecting to 'how much longer'",
                how_to_practice=(
                    "Count 4-count inhale, 4-count exhale. "
                    "When you lose count or mind wanders, simply start over. "
                    "No judgment. The return IS the practice. "
                    "Jackson had the Bulls do this before every game."
                ),
                key_phrase="Return to breath",
                success_indicator="You noticed wandering at least 5 times and returned each time without frustration",
                difficulty_level=1,
            ),
            "developing": MentalSkillPrescription(
                skill_name="Pain as Information",
                source_inspiration="Courtney Dauwalter",
                description="Treat sensation as data rather than threat",
                when_to_use="When discomfort makes you want to back off",
                how_to_practice=(
                    "When you feel 'pain,' get specific: "
                    "Where exactly? Sharp or dull? Constant or pulsing? "
                    "Does it change with technique adjustments? "
                    "You're a scientist collecting data, not a victim of suffering. "
                    "Dauwalter uses this for 200-mile races."
                ),
                key_phrase="This is information, not suffering",
                success_indicator="You can describe the sensation in detail without using the word 'pain'",
                difficulty_level=2,
                prerequisite_skills=["breath_return"],
            ),
            "advanced": MentalSkillPrescription(
                skill_name="Don't Think Execution",
                source_inspiration="Tim Grover (MJ/Kobe trainer)",
                description="Trust preparation, eliminate doubt through action",
                when_to_use="During high-intensity intervals when doubt creeps in",
                how_to_practice=(
                    "Grover's mantra: 'Don't think. You already know what to do.' "
                    "When you catch yourself analyzing mid-effort, cut it off. "
                    "You've done this before. Your body knows. "
                    "Thinking creates hesitation. Just execute."
                ),
                key_phrase="Don't think. Just do.",
                success_indicator="You completed intervals without mid-effort mental negotiation",
                difficulty_level=3,
                prerequisite_skills=["breath_return", "pain_as_information"],
            ),
            "mastery": MentalSkillPrescription(
                skill_name="Mamba Detail Obsession",
                source_inspiration="Kobe Bryant",
                description="Find genuine engagement through obsessive craft refinement",
                when_to_use="During long or monotonous sessions",
                how_to_practice=(
                    "Kobe would work on one tiny detail until it was perfect. "
                    "Pick ONE micro-element this session. Obsess over it. "
                    "Not 'do the workout'â€”MASTER this element. "
                    "Feel the difference between good and perfect. "
                    "That gap is where you live today. "
                    "Boredom becomes impossible when you're hunting perfection."
                ),
                key_phrase="1% better at this one thing",
                success_indicator="You achieved genuine engagement/flow through detail focus",
                difficulty_level=4,
                prerequisite_skills=["breath_return", "pain_as_information", "dont_think"],
            ),
        }
        
        return skills.get(level, skills["developing"])
    
    def _build_chunk_strategy(self, session_type: str, duration_minutes: int) -> str:
        """Build mental chunking strategy using elite frameworks."""
        if duration_minutes > 120:
            return (
                "CIGNETTI'S STACK APPROACH:\n"
                f"Divide into {duration_minutes // 30} x 30-minute blocks.\n"
                "Each block is its own 'one-game season'â€”the only one that exists.\n"
                "  Block 1: Settle in, find rhythm (just this block)\n"
                "  Block 2: Technique obsession (just this block)\n"
                "  Block 3: Body data collection (just this block)\n"
                "  Block 4: Gratitude/presence (just this block)\n"
                "  Final block: Strong finish (just this block)\n\n"
                "'Stack those moments.' Each block builds on the last."
            )
        elif duration_minutes > 60:
            return (
                "THIRDS APPROACH (JACKSON'S ZEN):\n"
                "  First third: Chop wood. Just settle into the task.\n"
                "  Middle third: Carry water. Find the craft within.\n"
                "  Final third: The task remains the same. Your presence deepens.\n\n"
                "Only think about which third you're in. That's the only one that exists."
            )
        else:
            return (
                "GROVER'S ONE-REP FOCUS:\n"
                "Each interval is the ONLY interval.\n"
                "When it ends, the next one becomes the only one.\n"
                "Don't count total. Don't project. Just this one.\n"
                "'Don't think. You already know what to do.'"
            )
    
    def _build_micro_goals(self, session_type: str) -> List[str]:
        """Build small, achievable micro-goals using elite frameworks."""
        universal = [
            "Return to breath anchor at least 5 times (Jackson meditation)",
            "Use 'pain as information' reframe at least once (Dauwalter)",
            "Identify one Mamba detail to improve (Kobe)",
        ]
        
        type_specific = {
            "long_easy": [
                "Experience at least one moment of genuine presence (Jackson)",
                "Stack 4 quality 30-minute blocks (Cignetti)",
                "End with a genuine 'that was good' feeling",
            ],
            "threshold": [
                "Hold target power without mental negotiation for 3+ intervals (Grover)",
                "Treat burn as 'fitness purchase' not suffering (Grover)",
                "Find one technique cue to anchor on when fatigue hits (Kobe)",
            ],
            "vo2max": [
                "Complete intervals without counting remaining (Grover's 'don't think')",
                "Notice how quickly you recover betweenâ€”that's fitness (data collection)",
                "Use 'I've done this before' at least twice",
            ],
            "recovery": [
                "Stay truly easyâ€”resist ego push (Jackson's acceptance)",
                "Notice sensations of recovery as positive data",
                "Embrace the 'flux' (Jackson)â€”today's easy creates tomorrow's capacity",
            ],
            "race": [
                "Execute pre-race routine exactly as practiced (normalization)",
                "Use 'one-game season' mindsetâ€”this is the only race (Cignetti)",
                "Treat race as 'Tuesday's workout with a bib number'",
            ],
        }
        
        return universal + type_specific.get(session_type, [])
    
    def _build_anticipation_reframe(self, session_type: str) -> str:
        """Build pre-session reframe using elite athlete language."""
        reframes = {
            "long_easy": (
                "Tomorrow is moving meditation (Jackson). "
                "You get 2+ hours to practice presenceâ€”most people pay for meditation retreats. "
                "Before enlightenment, pedal. After enlightenment, pedal. "
                "The task doesn't change. Your presence in it can."
            ),
            "threshold": (
                "Tomorrow's threshold work is where you purchase fitness that "
                "your competitors won't (Grover's 'comfortable being uncomfortable'). "
                "The burn is currency. The discomfort is information (Dauwalter). "
                "You're not dreading painâ€”you're anticipating investment."
            ),
            "vo2max": (
                "Tomorrow's VO2max: 'Don't think. You already know what to do.' (Grover) "
                "Your body has done these intervals. Trust it. "
                "A few minutes of hard work that raises your ceiling. "
                "Physical dominance makes you great. Mental dominance makes you unstoppable."
            ),
            "recovery": (
                "Tomorrow is recoveryâ€”training through rest (Jackson's flux acceptance). "
                "Everything is always in flux. Your body builds fitness during recovery, "
                "not during work. What you resist persists. Accept easy."
            ),
            "race": (
                "Race day is a 'one-game season' (Cignetti). "
                "Not specialâ€”singular. It's the only race that exists. "
                "You've done this exact effort in training. Nothing new. "
                "Execute the process. 'Job's not finished.' (Kobe)"
            ),
        }
        return reframes.get(session_type, "Tomorrow is an opportunity to stack another quality moment (Cignetti).")
    
    def _build_reflection_prompt(self, session_type: str) -> str:
        """Build post-session reflection using elite frameworks."""
        return (
            "POST-SESSION REFLECTION:\n\n"
            "1. JORDAN CHECK: Did anything 'fail'? What did you learn from it?\n"
            "   ('I've failed over and over. That is why I succeed.')\n\n"
            "2. KOBE CHECK: Did you improve 1% at your focus detail?\n"
            "   What will you obsess over next time?\n\n"
            "3. GROVER CHECK: Were there moments you overthought?\n"
            "   Where could you have just executed?\n\n"
            "4. JACKSON CHECK: Was there a moment of genuine presence?\n"
            "   What helped you get there?\n\n"
            "5. ONE WORD: What word captures this session?\n\n"
            "6. CIGNETTI STACK: How does this session stack on the last?\n"
            "   What did you build?"
        )
    
    def generate_race_normalization_plan(
        self,
        race_name: str,
        race_date: datetime,
        race_duration_hours: float
    ) -> List[Dict[str, Any]]:
        """
        Generate a plan to make race day feel mundane using elite frameworks.
        
        Cignetti's 'one-game season' + Jackson's 'just another swim meet' approach.
        """
        days_out = (race_date - datetime.now()).days
        
        plan = []
        
        # Dress rehearsals
        if days_out > 28:
            plan.append({
                "week": -4,
                "type": "dress_rehearsal",
                "instruction": (
                    f"Full race simulation at 85% duration ({race_duration_hours * 0.85:.1f} hrs). "
                    "Wear race kit. Use race nutrition. Start at race time. "
                    "Practice pre-race routine exactly as you will on race day."
                ),
                "mental_focus": (
                    "CIGNETTI: This IS the game. Not practice FOR the game. "
                    "One-game season. Full execution mindset."
                ),
            })
        
        if days_out > 14:
            plan.append({
                "week": -2,
                "type": "dress_rehearsal",
                "instruction": (
                    f"Race simulation at 70% duration ({race_duration_hours * 0.7:.1f} hrs). "
                    "Final dress rehearsal. Everything exactly as race day."
                ),
                "mental_focus": (
                    "Repetition #2. Race day will be #3. Nothing new. "
                    "You're building the 'I've done this before' neural pathway."
                ),
            })
        
        # Race-pace sessions
        plan.append({
            "week": -3,
            "type": "race_pace",
            "instruction": "30-40 minutes at goal race pace/power. Feel what race day will feel like.",
            "mental_focus": (
                "GROVER: 'Don't think. You already know.' "
                "This exact effort is what you'll hold. You've done it. You can do it."
            ),
        })
        
        plan.append({
            "week": -1,
            "type": "opener",
            "instruction": "15-20 minutes easy with 3x30sec at race pace. Activation, not depletion.",
            "mental_focus": (
                "The engine is ready. You've touched race pace. "
                "Body knows what to do. Trust the preparation."
            ),
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
            "mental_focus": (
                "JACKSON: You've 'done' this race 14 times in your head before you toe the line. "
                "The neural pathways are worn. Nothing new."
            ),
        })
        
        # Mantras
        plan.append({
            "timing": "Race week",
            "type": "mantra_practice",
            "mantras": [
                "One-game season (Cignetti)",
                "Don't think. Execute. (Grover)",
                "Job's not finished (Kobe)",
                "I've done this before",
                "Be where your feet are",
            ],
            "instruction": "Pick 2-3 mantras. Use them when anxiety rises.",
        })
        
        # Race morning
        plan.append({
            "timing": "Race morning",
            "type": "race_morning_protocol",
            "instruction": (
                "1. Wake at normal training time\n"
                "2. Eat normal pre-long-session breakfast\n"
                "3. Arrive at venueâ€”it's just a training location\n"
                "4. Warm up exactly as you have in training\n"
                "5. At the start line: 'One-game season. This is the only race.'\n\n"
                "CIGNETTI: Same face on the sideline first play and last play. "
                "No extra emotion. Just execution."
            ),
        })
        
        return plan


def integrate_with_session(physical_prescription: Dict, athlete_level: str = "developing") -> Dict:
    """
    Integrate mental prescription with physical prescription.
    """
    engine = MindsetPrescriptionEngine()
    
    session_type = physical_prescription.get("type", "threshold")
    duration = physical_prescription.get("duration_minutes", 60)
    
    mindset = engine.prescribe_for_session(
        session_type=session_type,
        duration_minutes=duration,
        athlete_level=athlete_level,
    )
    
    return {
        "physical": physical_prescription,
        "mental": {
            "amateur_narrative": mindset.amateur_narrative,
            "elite_narrative": mindset.elite_narrative,
            "source_quote": mindset.source_quote,
            "source_attribution": mindset.source_attribution,
            "attention_strategy": mindset.attention_instruction,
            "chunk_strategy": mindset.chunk_strategy,
            "mantras": mindset.suggested_mantras,
            "micro_goals": mindset.micro_goals,
            "skill_to_practice": {
                "name": mindset.skill_prescription.skill_name,
                "source": mindset.skill_prescription.source_inspiration,
                "how": mindset.skill_prescription.how_to_practice,
                "key_phrase": mindset.skill_prescription.key_phrase,
                "success": mindset.skill_prescription.success_indicator,
            } if mindset.skill_prescription else None,
            "anticipation": mindset.anticipation_reframe,
            "reflection_prompt": mindset.post_session_reflection,
        },
    }


def demo_mindset_prescription():
    """Show what a complete session prescription looks like with authentic language."""
    
    physical = {
        "type": "threshold",
        "duration_minutes": 70,
        "description": "4x10min at 88-92% FTP, 3min recovery",
        "target_power": "235-245W",
    }
    
    complete = integrate_with_session(physical, athlete_level="developing")
    
    print("=" * 80)
    print("COMPLETE SESSION PRESCRIPTION (v2.0 - Authentic Elite Language)")
    print("=" * 80)
    print()
    print("PHYSICAL:")
    print(f"  {complete['physical']['description']}")
    print(f"  Target: {complete['physical']['target_power']}")
    print()
    print("MENTAL FRAMEWORK:")
    print()
    print("  What the untrained mind thinks:")
    print(f"    \"{complete['mental']['amateur_narrative']}\"")
    print()
    print("  How elite athletes frame it:")
    print(f"    \"{complete['mental']['elite_narrative']}\"")
    print()
    print(f"  Source: {complete['mental']['source_attribution']}")
    print(f"    \"{complete['mental']['source_quote']}\"")
    print()
    print("-" * 80)
    print("ATTENTION STRATEGY:")
    print(complete['mental']['attention_strategy'])
    print()
    print("-" * 80)
    print("CHUNKING STRATEGY:")
    print(complete['mental']['chunk_strategy'])
    print()
    print("-" * 80)
    print("MANTRAS FOR THIS SESSION:")
    for mantra in complete['mental']['mantras']:
        print(f"  â€¢ {mantra}")
    print()
    print("-" * 80)
    print("MICRO-GOALS:")
    for goal in complete['mental']['micro_goals']:
        print(f"  â€¢ {goal}")
    print()
    print("-" * 80)
    print("SKILL TO PRACTICE:")
    skill = complete['mental']['skill_to_practice']
    print(f"  Name: {skill['name']}")
    print(f"  Source: {skill['source']}")
    print(f"  Key Phrase: \"{skill['key_phrase']}\"")
    print(f"  How: {skill['how']}")
    print(f"  Success: {skill['success']}")
    print()
    print("-" * 80)
    print("NIGHT-BEFORE REFRAME:")
    print(f"  {complete['mental']['anticipation']}")
    print()
    print("-" * 80)
    print("POST-SESSION REFLECTION:")
    print(complete['mental']['reflection_prompt'])
    print()
    print("=" * 80)


def demo_all_session_types():
    """Demo reframes for all session types."""
    
    print("\n" + "=" * 80)
    print("ELITE REFRAMES BY SESSION TYPE")
    print("=" * 80)
    
    session_types = ["long_easy", "threshold", "vo2max", "tempo", "recovery", "drills", "race", "failed_workout"]
    
    for session_type in session_types:
        reframe = EliteMindsetLibrary.get_reframe(session_type)
        print(f"\n{'â”€' * 80}")
        print(f"SESSION TYPE: {session_type.upper()}")
        print(f"{'â”€' * 80}")
        print(f"\nAmateur thinking:")
        print(f"  \"{reframe['amateur']}\"")
        print(f"\nElite reframe:")
        print(f"  \"{reframe['elite']}\"")
        print(f"\nSource: {reframe['attribution']}")
        print(f"  \"{reframe['quote']}\"")
        print(f"\nPractice:")
        print(f"  {reframe['practice']}")


if __name__ == "__main__":
    demo_mindset_prescription()
    print("\n\n")
    demo_all_session_types()
