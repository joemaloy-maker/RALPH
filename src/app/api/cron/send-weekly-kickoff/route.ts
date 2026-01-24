import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendMessageWithButtons } from '@/lib/telegram'
import {
  formatWeeklyKickoff,
  getCurrentWeekNumber,
  findWeekByNumber,
  getAthleteGoalText,
} from '@/lib/weekly-kickoff'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/send-weekly-kickoff
 *
 * Called by cron job on Sunday evening or Monday morning.
 * Sends weekly kickoff message to all connected athletes.
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
          continue
        }

        const weeks = plan.weeks as unknown as Array<{
          week_number: number
          focus?: string
          spacing_rules?: string[]
          days: Record<string, unknown>
        }>

        if (!weeks || weeks.length === 0) {
          console.log(`Empty weeks array for athlete ${athlete.id}`)
          continue
        }

        // Find current week
        const currentWeekNumber = getCurrentWeekNumber(plan.created_at, weeks.length)
        const currentWeek = findWeekByNumber(weeks, currentWeekNumber)

        if (!currentWeek) {
          console.log(`Could not find week ${currentWeekNumber} for athlete ${athlete.id}`)
          continue
        }

        // Get athlete's goal text
        const goalText = getAthleteGoalText(athlete.onboarding_answers)

        // Format the kickoff message
        const message = formatWeeklyKickoff(
          currentWeek,
          goalText,
          appUrl,
          athlete.id
        )

        // Send via Telegram with button
        const result = await sendMessageWithButtons(
          athlete.telegram_chat_id!,
          message,
          [
            {
              text: 'View full plan →',
              url: `${appUrl}/plan/${athlete.id}`,
            },
          ]
        )

        if (result.success) {
          sentCount++
        } else if (result.blocked) {
          // User blocked the bot - could update database to mark this
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
      message: 'Weekly kickoff complete',
      sent: sentCount,
      errors: errorCount,
      errorDetails: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Error in weekly kickoff cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
