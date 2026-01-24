/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ValidationResult {
  valid: boolean
  tier: 1 | 2 | 3
  warnings: string[]
  errors: string[]
  plan: any | null
  repairPrompt: string | null
}

/**
 * Strip markdown code blocks from input
 */
function stripMarkdownCodeBlocks(input: string): string {
  // Remove ```json ... ``` or ``` ... ```
  let cleaned = input.trim()

  // Match ```json or ``` at start
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '')

  // Match ``` at end
  cleaned = cleaned.replace(/\n?```\s*$/i, '')

  return cleaned.trim()
}

/**
 * Coerce string numbers to actual numbers
 */
function coerceNumbers(obj: any): any {
  if (obj === null || obj === undefined) return obj

  if (Array.isArray(obj)) {
    return obj.map(coerceNumbers)
  }

  if (typeof obj === 'object') {
    const result: any = {}
    for (const [key, value] of Object.entries(obj)) {
      // Fields that should be numbers
      const numericFields = ['duration_minutes', 'minutes', 'reps', 'week_number', 'days_per_week', 'weeks_in_plan']
      if (numericFields.includes(key) && typeof value === 'string') {
        const num = parseInt(value, 10)
        result[key] = isNaN(num) ? value : num
      } else {
        result[key] = coerceNumbers(value)
      }
    }
    return result
  }

  return obj
}

/**
 * Fill missing optional fields with defaults
 */
function fillDefaults(plan: any): any {
  if (!plan || !plan.weeks) return plan

  for (const week of plan.weeks) {
    if (!week.days) continue

    for (const dayName of Object.keys(week.days)) {
      const day = week.days[dayName]
      if (!day) continue

      // Fill cue default
      if (day.cue === undefined) {
        day.cue = ''
      }

      // Fill strength defaults
      if (day.strength === undefined) {
        day.strength = {
          timing: 'none',
          duration_minutes: null,
          focus: null,
          exercises: null
        }
      } else {
        if (day.strength.timing === undefined) day.strength.timing = 'none'
        if (day.strength.duration_minutes === undefined) day.strength.duration_minutes = null
        if (day.strength.focus === undefined) day.strength.focus = null
        if (day.strength.exercises === undefined) day.strength.exercises = null
      }
    }
  }

  return plan
}

/**
 * Sort weeks by week_number and renumber if needed
 */
function sortAndRenumberWeeks(plan: any): { plan: any; wasReordered: boolean } {
  if (!plan || !plan.weeks || !Array.isArray(plan.weeks)) {
    return { plan, wasReordered: false }
  }

  // Check if weeks are in order
  const originalOrder = plan.weeks.map((w: any) => w.week_number)
  const sortedOrder = [...originalOrder].sort((a, b) => (a || 0) - (b || 0))
  const wasReordered = JSON.stringify(originalOrder) !== JSON.stringify(sortedOrder)

  // Sort weeks by week_number
  plan.weeks.sort((a: any, b: any) => (a.week_number || 0) - (b.week_number || 0))

  // Renumber weeks starting from 1
  plan.weeks.forEach((week: any, index: number) => {
    week.week_number = index + 1
  })

  return { plan, wasReordered }
}

/**
 * Truncate long cues to 15 words
 */
function truncateLongCues(plan: any): { plan: any; truncatedCount: number } {
  let truncatedCount = 0

  if (!plan || !plan.weeks) return { plan, truncatedCount }

  for (const week of plan.weeks) {
    if (!week.days) continue

    for (const dayName of Object.keys(week.days)) {
      const day = week.days[dayName]
      if (!day || !day.cue) continue

      const words = day.cue.trim().split(/\s+/)
      if (words.length > 15) {
        day.cue = words.slice(0, 15).join(' ') + '...'
        truncatedCount++
      }
    }
  }

  return { plan, truncatedCount }
}

/**
 * Count words in a string
 */
function _wordCount(str: string): number {
  return str.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Validate a plan with 3-tier system
 */
export function validatePlan(rawInput: string): ValidationResult {
  const warnings: string[] = []
  const errors: string[] = []

  // TIER 1: Auto-fix
  let cleaned = stripMarkdownCodeBlocks(rawInput)
  cleaned = cleaned.trim()

  // Try to parse JSON
  let plan: any = null
  try {
    plan = JSON.parse(cleaned)
  } catch {
    // TIER 3: Not valid JSON
    errors.push('Invalid JSON format - could not parse')
    return {
      valid: false,
      tier: 3,
      warnings: [],
      errors,
      plan: null,
      repairPrompt: generateRepairPrompt(errors)
    }
  }

  // Coerce string numbers
  plan = coerceNumbers(plan)

  // Fill defaults
  plan = fillDefaults(plan)

  // Sort and renumber weeks if needed
  const { plan: sortedPlan, wasReordered } = sortAndRenumberWeeks(plan)
  plan = sortedPlan

  // Truncate long cues
  const { plan: truncatedPlan, truncatedCount } = truncateLongCues(plan)
  plan = truncatedPlan

  // TIER 3: Critical structure checks
  if (!plan.weeks || !Array.isArray(plan.weeks)) {
    errors.push('Missing "weeks" array')
  }

  if (plan.weeks && plan.weeks.length === 0) {
    errors.push('Weeks array is empty')
  }

  // Check for days in weeks
  let weeksWithoutDays = 0
  let totalDays = 0
  let daysWithoutSessionType = 0

  if (plan.weeks && Array.isArray(plan.weeks)) {
    for (let i = 0; i < plan.weeks.length; i++) {
      const week = plan.weeks[i]
      if (!week.days || Object.keys(week.days).length === 0) {
        weeksWithoutDays++
      } else {
        for (const dayName of Object.keys(week.days)) {
          const day = week.days[dayName]
          totalDays++
          if (!day.session_type) {
            daysWithoutSessionType++
          }
        }
      }
    }
  }

  if (weeksWithoutDays > 0 && weeksWithoutDays === plan.weeks?.length) {
    errors.push('No weeks have days defined')
  }

  // Check if majority of days missing session_type
  if (totalDays > 0 && daysWithoutSessionType > totalDays / 2) {
    errors.push(`${daysWithoutSessionType} of ${totalDays} days missing session_type`)
  }

  // If tier 3 errors, return invalid
  if (errors.length > 0) {
    return {
      valid: false,
      tier: 3,
      warnings: [],
      errors,
      plan: null,
      repairPrompt: generateRepairPrompt(errors)
    }
  }

  // TIER 2: Warnings
  if (!plan.macro_plan) {
    warnings.push('Missing macro_plan - plan will work but lacks phase structure')
  }

  // Warn if weeks were reordered
  if (wasReordered) {
    warnings.push('Weeks were out of order and have been renumbered')
  }

  // Warn if cues were truncated
  if (truncatedCount > 0) {
    warnings.push(`${truncatedCount} cues were truncated to 15 words`)
  }

  // Check for missing structure arrays
  let sessionsWithoutStructure = 0
  let restDayCount = 0
  let totalSessionCount = 0

  if (plan.weeks) {
    for (const week of plan.weeks) {
      if (!week.days) continue
      for (const dayName of Object.keys(week.days)) {
        const day = week.days[dayName]
        totalSessionCount++
        if (day.session_type === 'rest') {
          restDayCount++
        } else if (!day.structure || day.structure.length === 0) {
          sessionsWithoutStructure++
        }
      }
    }
  }

  if (sessionsWithoutStructure > 0) {
    warnings.push(`${sessionsWithoutStructure} sessions missing structure array`)
  }

  // Warn if plan is all rest days
  if (totalSessionCount > 0 && restDayCount === totalSessionCount) {
    warnings.push('Plan contains only rest days - no training sessions found')
  } else if (totalSessionCount > 0 && restDayCount > totalSessionCount * 0.8) {
    warnings.push(`Plan is mostly rest days (${restDayCount}/${totalSessionCount})`)
  }

  // Determine tier
  const tier = warnings.length > 0 ? 2 : 1

  return {
    valid: true,
    tier,
    warnings,
    errors: [],
    plan,
    repairPrompt: null
  }
}

/**
 * Generate repair prompt for invalid plans
 */
function generateRepairPrompt(errors: string[]): string {
  const errorList = errors.map(e => `- ${e}`).join('\n')

  return `The plan you generated had these issues:
${errorList}

Please regenerate following the schema exactly. Remember:
- Return ONLY valid JSON
- No markdown, no explanation
- Every session needs: session_type, title, duration_minutes, structure, cue
- The weeks array must contain week objects with days
- Each day must have a session_type`
}

/**
 * Format a day's session for preview
 */
export function formatSessionPreview(day: any): string {
  if (!day) return 'No session'
  if (day.session_type === 'rest') return 'Rest'

  return `${day.title || 'Untitled'} (${day.duration_minutes || '?'}min)`
}

/**
 * Get week preview for display
 */
export function getWeekPreview(week: any): { day: string; session: string; cue: string }[] {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const preview: { day: string; session: string; cue: string }[] = []

  if (!week || !week.days) return preview

  for (const dayName of days) {
    const day = week.days[dayName]
    if (day) {
      preview.push({
        day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        session: formatSessionPreview(day),
        cue: day.cue || ''
      })
    }
  }

  return preview
}
