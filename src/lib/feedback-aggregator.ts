import { createServerClient } from '@/lib/supabase'

/**
 * Feedback aggregation summary
 */
export interface FeedbackSummary {
  total_sessions: number
  completed: number
  modified: number
  skipped: number
  completion_rate: number

  skip_reasons: {
    life: number
    tired: number
    injured: number
    didnt_want_to: number
  }

  skip_patterns: {
    by_day: Record<string, number>
    by_session_type: Record<string, number>
  }

  rpe_averages: {
    overall: number | null
    by_session_type: Record<string, number>
  }

  notes: string[]
}

/**
 * Convert RPE string to numeric value for averaging
 */
function rpeToNumber(rpe: string): number | null {
  const rpeMap: Record<string, number> = {
    '1': 1,
    '2-3': 2.5,
    '4-5': 4.5,
    '6-7': 6.5,
    '8-9': 8.5,
    '10': 10,
  }
  return rpeMap[rpe] ?? null
}

/**
 * Get day of week name from date string
 */
function getDayOfWeek(dateStr: string): string {
  const date = new Date(dateStr)
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[date.getDay()]
}

/**
 * Aggregate feedback data for an athlete over a date range
 */
export async function aggregateFeedback(
  athleteId: string,
  startDate: string,
  endDate: string
): Promise<FeedbackSummary> {
  const supabase = createServerClient()

  // Get all sessions for the athlete's plans within the date range
  const { data: plans } = await supabase
    .from('plans')
    .select('id')
    .eq('athlete_id', athleteId)

  if (!plans || plans.length === 0) {
    return emptyFeedbackSummary()
  }

  const planIds = plans.map((p) => p.id)

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*')
    .in('plan_id', planIds)
    .gte('date', startDate)
    .lte('date', endDate)

  if (error || !sessions || sessions.length === 0) {
    return emptyFeedbackSummary()
  }

  // Count by status
  const completed = sessions.filter((s) => s.status === 'completed').length
  const modified = sessions.filter((s) => s.status === 'modified').length
  const skipped = sessions.filter((s) => s.status === 'skipped').length
  const total_sessions = sessions.length
  const completion_rate = total_sessions > 0
    ? Math.round(((completed + modified) / total_sessions) * 100)
    : 0

  // Aggregate skip reasons
  const skip_reasons = {
    life: 0,
    tired: 0,
    injured: 0,
    didnt_want_to: 0,
  }

  const skippedSessions = sessions.filter((s) => s.status === 'skipped')
  for (const session of skippedSessions) {
    const reason = session.skip_reason as keyof typeof skip_reasons
    if (reason && skip_reasons[reason] !== undefined) {
      skip_reasons[reason]++
    }
  }

  // Skip patterns by day
  const by_day: Record<string, number> = {
    sunday: 0,
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
  }

  for (const session of skippedSessions) {
    if (session.date) {
      const day = getDayOfWeek(session.date)
      by_day[day]++
    }
  }

  // Skip patterns by session type
  const by_session_type: Record<string, number> = {}
  for (const session of skippedSessions) {
    const sessionType = session.session_type || 'unknown'
    by_session_type[sessionType] = (by_session_type[sessionType] || 0) + 1
  }

  // RPE averages
  const sessionsWithRpe = sessions.filter((s) => s.rpe)
  const rpeValues = sessionsWithRpe
    .map((s) => rpeToNumber(s.rpe!))
    .filter((v): v is number => v !== null)

  const overall = rpeValues.length > 0
    ? Math.round((rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length) * 10) / 10
    : null

  // RPE by session type
  const rpe_by_type: Record<string, { sum: number; count: number }> = {}
  for (const session of sessionsWithRpe) {
    const sessionType = session.session_type || 'unknown'
    const rpeNum = rpeToNumber(session.rpe!)
    if (rpeNum !== null) {
      if (!rpe_by_type[sessionType]) {
        rpe_by_type[sessionType] = { sum: 0, count: 0 }
      }
      rpe_by_type[sessionType].sum += rpeNum
      rpe_by_type[sessionType].count++
    }
  }

  const rpe_averages_by_type: Record<string, number> = {}
  for (const [type, data] of Object.entries(rpe_by_type)) {
    rpe_averages_by_type[type] = Math.round((data.sum / data.count) * 10) / 10
  }

  // Collect notes
  const notes = sessions
    .filter((s) => s.notes && s.notes.trim())
    .map((s) => s.notes as string)

  return {
    total_sessions,
    completed,
    modified,
    skipped,
    completion_rate,
    skip_reasons,
    skip_patterns: {
      by_day,
      by_session_type,
    },
    rpe_averages: {
      overall,
      by_session_type: rpe_averages_by_type,
    },
    notes,
  }
}

/**
 * Return an empty feedback summary
 */
function emptyFeedbackSummary(): FeedbackSummary {
  return {
    total_sessions: 0,
    completed: 0,
    modified: 0,
    skipped: 0,
    completion_rate: 0,
    skip_reasons: {
      life: 0,
      tired: 0,
      injured: 0,
      didnt_want_to: 0,
    },
    skip_patterns: {
      by_day: {},
      by_session_type: {},
    },
    rpe_averages: {
      overall: null,
      by_session_type: {},
    },
    notes: [],
  }
}

/**
 * Find the day with most skips
 */
function findProblemDay(byDay: Record<string, number>): string | null {
  let maxDay: string | null = null
  let maxCount = 0

  for (const [day, count] of Object.entries(byDay)) {
    if (count > maxCount) {
      maxCount = count
      maxDay = day
    }
  }

  return maxCount > 0 ? maxDay : null
}

/**
 * Find the session type with highest average RPE
 */
function findHighRpeType(byType: Record<string, number>): { type: string; rpe: number } | null {
  let maxType: string | null = null
  let maxRpe = 0

  for (const [type, rpe] of Object.entries(byType)) {
    if (rpe > maxRpe) {
      maxRpe = rpe
      maxType = type
    }
  }

  return maxType ? { type: maxType, rpe: maxRpe } : null
}

/**
 * Describe skip patterns in human-readable form
 */
function describeSkipPatterns(
  byDay: Record<string, number>,
  skipReasons: FeedbackSummary['skip_reasons']
): string {
  const problemDay = findProblemDay(byDay)
  if (!problemDay) {
    return 'No consistent pattern'
  }

  // Find most common reason
  const reasons = Object.entries(skipReasons)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])

  const topReason = reasons.length > 0 ? reasons[0][0].replace('_', ' ') : null

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

  if (topReason) {
    return `${capitalize(problemDay)}s: ${byDay[problemDay]} skips, mostly "${capitalize(topReason)}"`
  }

  return `${capitalize(problemDay)}s: ${byDay[problemDay]} skips`
}

/**
 * Summarize notes for prompt inclusion
 */
function summarizeNotes(notes: string[], maxItems: number = 3): string {
  if (notes.length === 0) {
    return 'None provided'
  }

  const truncated = notes.slice(0, maxItems)
  const summary = truncated.map((n) => `"${n.substring(0, 100)}${n.length > 100 ? '...' : ''}"`).join('; ')

  if (notes.length > maxItems) {
    return `${summary} (+${notes.length - maxItems} more)`
  }

  return summary
}

/**
 * Format feedback summary into a prompt block for re-prompts
 */
export function formatFeedbackBlock(
  summary: FeedbackSummary,
  weekStart: number,
  weekEnd: number
): string {
  if (summary.total_sessions === 0) {
    return `EXECUTION DATA (Weeks ${weekStart}-${weekEnd}):
No sessions completed yet. Build the plan based on the athlete's stated capacity and adjust conservatively.`
  }

  const skipPatternDescription = describeSkipPatterns(
    summary.skip_patterns.by_day,
    summary.skip_reasons
  )

  const highRpeType = findHighRpeType(summary.rpe_averages.by_session_type)
  const problemDay = findProblemDay(summary.skip_patterns.by_day)

  let adjustmentInstructions = ''

  if (summary.completion_rate < 70 && problemDay) {
    adjustmentInstructions += `\nIf compliance is low on ${problemDay}s, consider moving or modifying that session.`
  }

  if (highRpeType && highRpeType.rpe >= 8) {
    adjustmentInstructions += `\nIf RPE is consistently high on ${highRpeType.type} sessions (avg ${highRpeType.rpe}), reduce intensity or volume.`
  }

  const rpeOnThreshold = summary.rpe_averages.by_session_type['threshold']
    || summary.rpe_averages.by_session_type['tempo']
    || summary.rpe_averages.overall

  return `EXECUTION DATA (Weeks ${weekStart}-${weekEnd}):
- Sessions completed: ${summary.completed} of ${summary.total_sessions} (${summary.completion_rate}%)
- Sessions modified: ${summary.modified}
- Sessions skipped: ${summary.skipped}
- Skip patterns: ${skipPatternDescription}
- Average RPE on threshold work: ${rpeOnThreshold !== null ? rpeOnThreshold : 'N/A'}
- Athlete notes: ${summarizeNotes(summary.notes)}

Adjust the next two weeks based on this data.${adjustmentInstructions}`
}

/**
 * Get feedback for the last N weeks
 */
export async function getRecentFeedback(
  athleteId: string,
  weeks: number = 2
): Promise<{ summary: FeedbackSummary; startDate: string; endDate: string }> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - weeks * 7)

  const summary = await aggregateFeedback(
    athleteId,
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  )

  return {
    summary,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  }
}
