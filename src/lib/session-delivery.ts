/* eslint-disable @typescript-eslint/no-explicit-any */

interface StructureSegment {
  segment?: string
  type?: string
  minutes?: number
  reps?: number
  rep_duration?: string
  intensity?: string
  description?: string
}

interface SessionData {
  session_type: string
  title: string
  duration_minutes?: number
  cue?: string
  structure?: StructureSegment[]
  strength?: {
    timing?: string
    duration_minutes?: number
    focus?: string
  }
}

/**
 * Get a human-readable summary of the session structure
 */
export function getStructureSummary(structure: StructureSegment[]): string {
  if (!structure || structure.length === 0) {
    return ''
  }

  const parts: string[] = []

  for (const segment of structure) {
    const segmentType = segment.segment || segment.type || 'main'
    let part = ''

    if (segment.reps && segment.rep_duration) {
      // Interval format: "6×5min threshold"
      part = `${segment.reps}×${segment.rep_duration}`
      if (segment.intensity && segment.intensity !== 'easy') {
        part += ` ${segment.intensity}`
      }
    } else if (segment.minutes) {
      // Duration format: "10 min warmup"
      part = `${segment.minutes} min ${segmentType}`
    } else if (segment.description) {
      // Description only
      part = segment.description
    }

    if (part) {
      parts.push(part)
    }
  }

  return parts.join(' → ')
}

/**
 * Get session type emoji
 */
function getSessionEmoji(sessionType: string): string {
  const emojis: Record<string, string> = {
    run: '🏃',
    bike: '🚴',
    swim: '🏊',
    brick: '🔥',
    strength: '💪',
    rest: '😴',
    cross: '⚡',
  }
  return emojis[sessionType] || '📋'
}

/**
 * Format a session card for Telegram delivery
 */
export function formatSessionCard(
  session: SessionData,
  dayName: string,
  _appUrl?: string,
  _athleteId?: string,
  _planId?: string
): string {
  const emoji = getSessionEmoji(session.session_type)
  const dayCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1)

  let message = `<b>${dayCapitalized}'s Session</b>\n\n`

  // Add cue prominently if present
  if (session.cue) {
    message += `<i>"${session.cue}"</i>\n\n`
  }

  // Session details
  message += `${emoji} <b>${session.title}</b>\n`

  if (session.duration_minutes) {
    message += `⏱ ${session.duration_minutes} min`
    if (session.session_type !== 'rest') {
      message += ` | ${session.session_type}`
    }
    message += '\n'
  }

  // Structure summary
  if (session.structure && session.structure.length > 0) {
    const summary = getStructureSummary(session.structure)
    if (summary) {
      message += `\n${summary}\n`
    }
  }

  // Strength add-on
  if (session.strength?.timing && session.strength.timing !== 'none') {
    message += `\n💪 +${session.strength.duration_minutes || '?'} min strength (${session.strength.timing})`
    if (session.strength.focus) {
      message += `: ${session.strength.focus}`
    }
    message += '\n'
  }

  return message
}

/**
 * Format a rest day message
 */
export function formatRestDayCard(dayName: string): string {
  const dayCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1)

  return `<b>${dayCapitalized}</b>\n\n😴 <b>Rest Day</b>\n\nRecover well. Your body adapts while you rest.`
}

/**
 * Get today's day name (lowercase)
 */
export function getTodayDayName(): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[new Date().getDay()]
}

/**
 * Find today's session from a week's data
 */
export function getTodaySession(week: any): { dayName: string; session: SessionData } | null {
  const todayName = getTodayDayName()

  if (!week?.days || !week.days[todayName]) {
    return null
  }

  return {
    dayName: todayName,
    session: week.days[todayName],
  }
}
