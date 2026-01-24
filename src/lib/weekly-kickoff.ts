/* eslint-disable @typescript-eslint/no-explicit-any */

interface WeekData {
  week_number: number
  focus?: string
  spacing_rules?: string[]
  days: Record<string, {
    session_type: string
    title: string
    priority?: string
    why?: string
    duration_minutes?: number
  }>
}

/**
 * Format a weekly kickoff message for Telegram
 */
export function formatWeeklyKickoff(week: WeekData, athleteGoal: string, _appUrl?: string, _athleteId?: string): string {
  const keyWorkouts: string[] = []
  const supportWorkouts: string[] = []

  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const dayLabels: Record<string, string> = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun',
  }

  // Sort sessions into key vs support
  for (const dayName of dayOrder) {
    const session = week.days[dayName]
    if (!session) continue

    const dayLabel = dayLabels[dayName]
    const title = session.title || session.session_type
    const why = session.why ? ` — ${session.why}` : ''

    if (session.session_type === 'rest') {
      supportWorkouts.push(`• ${dayLabel}: Rest`)
    } else if (session.priority === 'key') {
      keyWorkouts.push(`• ${dayLabel}: ${title}${why}`)
    } else {
      supportWorkouts.push(`• ${dayLabel}: ${title}${why}`)
    }
  }

  // Build the message
  let message = `<b>Week ${week.week_number}</b>`
  if (week.focus) {
    message += `: ${week.focus}`
  }
  message += '\n\n'

  if (keyWorkouts.length > 0) {
    message += `<b>KEY</b>\n${keyWorkouts.join('\n')}\n\n`
  }

  if (supportWorkouts.length > 0) {
    message += `<b>SUPPORT</b>\n${supportWorkouts.join('\n')}\n\n`
  }

  // Add spacing rules if present
  if (week.spacing_rules && week.spacing_rules.length > 0) {
    message += `<b>IF YOU NEED TO SHIFT</b>\n`
    for (const rule of week.spacing_rules) {
      message += `• ${rule}\n`
    }
    message += '\n'
  }

  // Add goal reminder
  message += `<i>Goal: ${athleteGoal}</i>`

  return message
}

/**
 * Get the current week number based on plan start date and today's date
 */
export function getCurrentWeekNumber(planCreatedAt: string, totalWeeks: number): number {
  const planStart = new Date(planCreatedAt)
  const today = new Date()

  // Calculate weeks elapsed
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const weeksElapsed = Math.floor((today.getTime() - planStart.getTime()) / msPerWeek)

  // Return current week (1-indexed), capped at total weeks
  return Math.min(Math.max(1, weeksElapsed + 1), totalWeeks)
}

/**
 * Find the week data for a given week number
 */
export function findWeekByNumber(weeks: any[], weekNumber: number): WeekData | null {
  return weeks.find((w: any) => w.week_number === weekNumber) || null
}

/**
 * Get athlete's goal text from onboarding answers
 */
export function getAthleteGoalText(answers: any): string {
  if (!answers) return 'Training'

  const { goal, runningDistance, triathlonDistance, raceDate } = answers

  if (goal === 'running' && runningDistance) {
    const dateStr = raceDate ? ` (${formatDate(raceDate)})` : ''
    return `${runningDistance}${dateStr}`
  }
  if (goal === 'triathlon' && triathlonDistance) {
    const dateStr = raceDate ? ` (${formatDate(raceDate)})` : ''
    return `${triathlonDistance} Triathlon${dateStr}`
  }
  if (goal === 'strength_pt') {
    return 'Strength & Recovery'
  }
  if (goal === 'add_structure') {
    return 'Structured Training'
  }

  return 'Training'
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
