import { OnboardingAnswers, MotivationMetadata, GoalType } from '@/app/onboard/page'

/**
 * Calculate age from birthdate string
 */
function calculateAge(birthdate: string): number {
  const birth = new Date(birthdate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

/**
 * Calculate weeks until a given date
 */
function weeksUntil(dateString: string): number {
  const target = new Date(dateString)
  const today = new Date()
  const diffMs = target.getTime() - today.getTime()
  const diffWeeks = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 7))
  return Math.max(0, diffWeeks)
}

/**
 * Get age-based strength framing per coaching methodology
 */
function getAgeBasedStrengthFraming(age: number): string {
  if (age < 30) {
    return 'Performance focus'
  } else if (age < 40) {
    return 'Durability focus'
  } else if (age < 50) {
    return 'Non-negotiable. Muscle preservation is the game.'
  } else {
    return 'Longevity focus. Bone density, functional strength.'
  }
}

/**
 * Build the athlete context block
 */
export function buildAthleteContextBlock(
  answers: OnboardingAnswers,
  _motivationMetadata: MotivationMetadata
): string {
  const age = answers.birthdate ? calculateAge(answers.birthdate) : 'Unknown'

  // Build fitness details based on goal type
  let fitnessStructured = ''
  let fitnessNotes = 'Not provided'

  if (answers.goal === 'running') {
    fitnessStructured = `Longest run: ${answers.longestRun || 'Not specified'}, Easy pace: ${answers.easyPace || 'Not specified'}`
    fitnessNotes = answers.runningBenchmarks || 'Not provided'
  } else if (answers.goal === 'triathlon') {
    fitnessStructured = `Strongest discipline: ${answers.strongestDiscipline || 'Not specified'}, Longest brick: ${answers.longestBrick || 'Not specified'}, Run pace off bike: ${answers.runPaceOffBike || 'Not specified'}`
    fitnessNotes = answers.triathlonBenchmarks || 'Not provided'
  } else if (answers.goal === 'strength_pt') {
    fitnessStructured = `Session duration: ${answers.sessionDuration || 'Not specified'}`
  } else if (answers.goal === 'add_structure') {
    fitnessStructured = `Hours active: ${answers.hoursActive || 'Not specified'}, Intensity: ${answers.activityIntensity || 'Not specified'}`
  }

  return `ATHLETE PROFILE:
- Age: ${age}
- Training days available: ${answers.daysPerWeek || 'Not specified'}
- Weekly hours available: ${answers.hoursPerWeek || 'Not specified'}
- Experience/intent: ${answers.experienceIntent || 'Not specified'}
- Injuries/limitations: ${answers.injuries || 'None'}
- Current fitness (structured): ${fitnessStructured}
- Current fitness (athlete notes): ${fitnessNotes}`
}

/**
 * Build goal block for running
 */
export function buildGoalBlockRunning(answers: OnboardingAnswers): string {
  const weeksToRace = answers.raceDate ? weeksUntil(answers.raceDate) : 'Not specified'

  return `GOAL:
- Race: ${answers.runningDistance || 'Not specified'}
- Date: ${answers.raceDate || 'Not specified'}
- Weeks until race: ${weeksToRace}
- Target (if any): Not specified`
}

/**
 * Build goal block for triathlon
 */
export function buildGoalBlockTriathlon(answers: OnboardingAnswers): string {
  const weeksToRace = answers.raceDate ? weeksUntil(answers.raceDate) : 'Not specified'

  return `GOAL:
- Race: ${answers.triathlonDistance || 'Not specified'} triathlon
- Date: ${answers.raceDate || 'Not specified'}
- Weeks until race: ${weeksToRace}
- Strongest discipline: ${answers.strongestDiscipline || 'Not specified'}
- Longest recent brick: ${answers.longestBrick || 'Not specified'}
- Run pace off bike: ${answers.runPaceOffBike || 'Not specified'}
- Athlete notes: ${answers.triathlonBenchmarks || 'Not provided'}`
}

/**
 * Build goal block for strength/PT
 */
export function buildGoalBlockStrengthPT(answers: OnboardingAnswers): string {
  return `GOAL:
- Primary objective: Consistent execution of ${answers.strengthPtType || 'strength/PT work'}
- Current compliance: ${answers.sessionDuration || "I don't do them"}
- Equipment: ${answers.strengthEquipment || 'Not specified'}`
}

/**
 * Build goal block for add structure
 */
export function buildGoalBlockAddStructure(answers: OnboardingAnswers): string {
  let desiredOutcome = answers.structureGoal || 'General fitness'
  if (answers.structureGoal === 'race') {
    desiredOutcome = `Race: ${answers.runningDistance || 'Not specified'}`
  } else if (answers.structureGoal === 'specific') {
    desiredOutcome = answers.structureGoalText || 'Specific outcome'
  }

  return `GOAL:
- Current activity: ${answers.currentActivity || 'Not specified'}
- Current volume: ${answers.hoursActive || 'Not specified'} hours/week, mostly ${answers.activityIntensity || 'mixed'}
- Desired outcome: ${desiredOutcome}
- Constraint: Do not remove current activity. Build around it.`
}

/**
 * Build strength training block with age-based framing
 */
export function buildStrengthBlock(answers: OnboardingAnswers): string {
  const age = answers.birthdate ? calculateAge(answers.birthdate) : 35
  const ageFraming = getAgeBasedStrengthFraming(typeof age === 'number' ? age : 35)

  // Map timing preference to placement string
  let placementStr = 'as recommended'
  if (answers.strengthTiming === 'with_cardio') {
    placementStr = 'combined with cardio sessions'
  } else if (answers.strengthTiming === 'standalone') {
    placementStr = 'on standalone days'
  }

  return `STRENGTH TRAINING:
- Current habit: ${answers.strengthCurrent || 'Not specified'}
- Equipment available: ${answers.strengthEquipment || 'Not specified'}
- Preferred placement: ${placementStr}
- Age-based priority: ${ageFraming}

Include strength sessions as appropriate, placed ${placementStr}. Prioritize anti-rotational core work (pallof press, dead bugs, bird dogs) and single-leg exercises (single-leg deadlifts, Bulgarian split squats, step-ups) per coaching methodology. For an athlete aged ${age}, frame strength as ${ageFraming}.`
}

/**
 * Build motivation block from metadata
 */
export function buildMotivationBlock(metadata: MotivationMetadata): string {
  const driver = metadata.whyTrain?.driver || 'Not specified'
  const witness = metadata.whoLookFor?.witness || metadata.whyTrain?.witness || 'Not specified'
  const fear = metadata.nightBefore?.fear || 'Not specified'
  const successOrientation = metadata.finishLine?.orientation || 'Not specified'

  // Collect prompt fuels
  const promptFuels: string[] = []
  if (metadata.whyTrain?.prompt_fuel) promptFuels.push(metadata.whyTrain.prompt_fuel)
  if (metadata.whoLookFor?.prompt_fuel) promptFuels.push(metadata.whoLookFor.prompt_fuel)
  if (metadata.finishLine?.session_fuel) promptFuels.push(metadata.finishLine.session_fuel)

  // Collect anti-patterns
  const antiPatterns = metadata.whyTrain?.anti_pattern || []

  // Get reframe for fear
  const reframe = metadata.nightBefore?.reframe || ''

  return `MOTIVATION PROFILE:
- Primary driver: ${driver}
- Validation source: ${witness}
- Core fear: ${fear}
- Success definition: ${successOrientation}

PROMPT FUEL (use in cues):
${promptFuels.map(f => `- ${f}`).join('\n') || '- Not specified'}

ANTI-PATTERNS (avoid this language):
${antiPatterns.map(a => `- ${a}`).join('\n') || '- None specified'}

REFRAME FOR HARD DAYS:
${reframe || 'Not specified'}

When writing session cues, speak to this athlete's driver. Reframe their fear on hard days. Match their success definition.`
}

/**
 * Build the output schema block
 */
export function buildOutputSchemaBlock(): string {
  return `OUTPUT SCHEMA:
Return the plan as a JSON object following this exact schema:

{
  "athlete_summary": {
    "goal": "string",
    "race_date": "YYYY-MM-DD or null",
    "weeks_in_plan": number,
    "days_per_week": number,
    "primary_driver": "string"
  },
  "macro_plan": {
    "phases": [
      {
        "name": "string",
        "weeks": "1-4",
        "focus": "string"
      }
    ],
    "taper_start": "YYYY-MM-DD or null",
    "key_workouts": ["string"]
  },
  "weeks": [
    {
      "week_number": number,
      "focus": "string",
      "spacing_rules": ["string"],
      "days": {
        "monday": {
          "session_type": "run | bike | swim | brick | strength | rest | cross",
          "title": "string",
          "duration_minutes": number,
          "priority": "key | support | recovery",
          "why": "string (1 sentence connecting to goal)",
          "flexible": boolean,
          "structure": [
            {
              "segment": "activation | warmup | main | cooldown",
              "minutes": number,
              "reps": number or null,
              "rep_duration": "string or null",
              "recovery": "string or null",
              "intensity": "easy | moderate | threshold | hard | max",
              "description": "string"
            }
          ],
          "cue": "string (max 15 words)",
          "strength": {
            "timing": "pre | post | standalone | none",
            "duration_minutes": number or null,
            "focus": "string or null",
            "exercises": ["string"] or null
          }
        },
        "tuesday": { ... },
        "wednesday": { ... },
        "thursday": { ... },
        "friday": { ... },
        "saturday": { ... },
        "sunday": { ... }
      }
    }
  ]
}`
}

/**
 * Build the enforceability block
 */
export function buildEnforceabilityBlock(): string {
  return `CRITICAL: Return ONLY the JSON object. No markdown code blocks. No explanation. No text before or after.

Before responding, verify:
- Every day includes session_type, title, duration_minutes, structure
- Every structure segment includes segment, minutes or reps, description
- strength.timing is one of: "pre", "post", "standalone", "none"
- All cues are under 15 words
- Cues use the athlete's motivation language, not generic encouragement

This output will be parsed programmatically. Schema violations will cause the plan to fail.`
}

/**
 * Assemble the complete prompt based on goal type
 */
export function assemblePrompt(
  answers: OnboardingAnswers,
  metadata: MotivationMetadata,
  goalType: GoalType
): string {
  const blocks: string[] = []

  // Always include athlete context
  blocks.push(buildAthleteContextBlock(answers, metadata))

  // Add goal-specific block
  switch (goalType) {
    case 'running':
      blocks.push(buildGoalBlockRunning(answers))
      blocks.push(buildStrengthBlock(answers))
      break
    case 'triathlon':
      blocks.push(buildGoalBlockTriathlon(answers))
      blocks.push(buildStrengthBlock(answers))
      break
    case 'strength_pt':
      blocks.push(buildGoalBlockStrengthPT(answers))
      // No separate strength block for strength/PT goal
      break
    case 'add_structure':
      blocks.push(buildGoalBlockAddStructure(answers))
      blocks.push(buildStrengthBlock(answers))
      break
  }

  // Always include motivation
  blocks.push(buildMotivationBlock(metadata))

  // Always include output schema and enforceability
  blocks.push(buildOutputSchemaBlock())
  blocks.push(buildEnforceabilityBlock())

  return blocks.join('\n\n---\n\n')
}

/**
 * Build the sync prompt for existing plans
 */
export function buildSyncPrompt(
  answers: OnboardingAnswers,
  metadata: MotivationMetadata,
  existingPlanText: string
): string {
  const blocks: string[] = []

  // Include athlete context
  blocks.push(buildAthleteContextBlock(answers, metadata))

  // Sync-specific instructions
  blocks.push(`EXISTING PLAN:
The athlete has an existing training plan below. Reformat it to the following JSON schema.
Preserve the intent, structure, and timing. Do not add, remove, or modify workouts—only restructure for schema compatibility.

---BEGIN EXISTING PLAN---
${existingPlanText}
---END EXISTING PLAN---`)

  // Include output schema and enforceability
  blocks.push(buildOutputSchemaBlock())
  blocks.push(buildEnforceabilityBlock())

  return blocks.join('\n\n---\n\n')
}
