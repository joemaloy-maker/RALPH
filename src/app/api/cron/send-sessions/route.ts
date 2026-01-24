import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendMessageWithButtons } from '@/lib/telegram'
import { getCurrentWeekNumber, findWeekByNumber } from '@/lib/weekly-kickoff'
import {
  formatSessionCard,
  formatRestDayCard,
  getTodaySession,
} from '@/lib/session-delivery'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/send-sessions
 *
 * Called by cron job daily at 7am (user's timezone ideally).
 * Sends today's session to all connected athletes.
 */
export async function GET(request: Request) {
  // Optional: Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    // Get all athletes with telegram connected
    const { data: athletes, error: athletesError } = await supabase
      .from('athletes')
      .select('id, telegram_chat_id, onboarding_answers')
      .not('telegram_chat_id', 'is', null)

    if (athletesError) {
      console.error('Error fetching athletes:', athletesError)
      return NextResponse.json({ error: 'Failed to fetch athletes' }, { status: 500 })
    }

    if (!athletes || athletes.length === 0) {
      return NextResponse.json({ message: 'No athletes with Telegram connected', sent: 0 })
    }

    let sentCount = 0
    let errorCount = 0
    let skippedCount = 0
    const errors: string[] = []

    for (const athlete of athletes) {
      try {
        // Get the athlete's latest plan
        const { data: plan, error: planError } = await supabase
          .from('plans')
          .select('id, weeks, created_at')
          .eq('athlete_id', athlete.id)
          .order('version', { ascending: false })
          .limit(1)
          .single()

        if (planError || !plan) {
          console.log(`No plan found for athlete ${athlete.id}`)
          skippedCount++
          continue
        }

        const weeks = plan.weeks as unknown as Array<{
          week_number: number
          days: Record<string, unknown>
        }>

        if (!weeks || weeks.length === 0) {
          console.log(`Empty weeks array for athlete ${athlete.id}`)
          skippedCount++
          continue
        }

        // Find current week
        const currentWeekNumber = getCurrentWeekNumber(plan.created_at, weeks.length)
        const currentWeek = findWeekByNumber(weeks, currentWeekNumber)

        if (!currentWeek) {
          console.log(`Could not find week ${currentWeekNumber} for athlete ${athlete.id}`)
          skippedCount++
          continue
        }

        // Get today's session
        const todayData = getTodaySession(currentWeek)

        if (!todayData) {
          console.log(`No session for today for athlete ${athlete.id}`)
          skippedCount++
          continue
        }

        const { dayName, session } = todayData

        // Format the message based on session type
        let message: string
        if (session.session_type === 'rest') {
          message = formatRestDayCard(dayName)
        } else {
          message = formatSessionCard(session, dayName, appUrl, athlete.id, plan.id)
        }

        // Send via Telegram with buttons
        const buttons = session.session_type === 'rest'
          ? [{ text: 'View week →', url: `${appUrl}/plan/${athlete.id}` }]
          : [
              { text: 'View details →', url: `${appUrl}/plan/${athlete.id}` },
              { text: 'Log session', callback_data: `log:${plan.id}:${dayName}` },
            ]

        const result = await sendMessageWithButtons(
          athlete.telegram_chat_id!,
          message,
          buttons
        )

        if (result.success) {
          sentCount++
        } else if (result.blocked) {
          console.log(`Athlete ${athlete.id} has blocked the bot`)
          errorCount++
        } else {
          errorCount++
          errors.push(`Failed to send to athlete ${athlete.id}`)
        }
      } catch (err) {
        console.error(`Error processing athlete ${athlete.id}:`, err)
        errorCount++
        errors.push(`Error for athlete ${athlete.id}: ${err}`)
      }
    }

    return NextResponse.json({
      message: 'Daily session delivery complete',
      sent: sentCount,
      skipped: skippedCount,
      errors: errorCount,
      errorDetails: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Error in session delivery cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
