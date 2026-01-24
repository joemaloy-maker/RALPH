import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendMessageWithButtons } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/reprompt-check
 *
 * Called daily to check which athletes are due for a re-prompt.
 * Athletes are due if:
 * - 14 days since plan created, OR
 * - Plan is running out of weeks
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
      .select('id, telegram_chat_id')
      .not('telegram_chat_id', 'is', null)

    if (athletesError) {
      console.error('Error fetching athletes:', athletesError)
      return NextResponse.json({ error: 'Failed to fetch athletes' }, { status: 500 })
    }

    if (!athletes || athletes.length === 0) {
      return NextResponse.json({ message: 'No athletes with Telegram connected', notified: 0 })
    }

    let notifiedCount = 0
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
          skippedCount++
          continue
        }

        const weeks = plan.weeks as unknown as Array<{ week_number: number }>
        if (!weeks || weeks.length === 0) {
          skippedCount++
          continue
        }

        // Calculate days since plan created
        const planCreatedAt = new Date(plan.created_at)
        const now = new Date()
        const daysSincePlanCreated = Math.floor(
          (now.getTime() - planCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
        )

        // Calculate which week we're in
        const weeksSincePlanCreated = Math.floor(daysSincePlanCreated / 7)
        const currentWeekIndex = weeksSincePlanCreated
        const weeksRemaining = weeks.length - currentWeekIndex - 1

        // Check if due for re-prompt:
        // - Every 14 days (start of week 3, 5, 7, etc.)
        // - OR if only 1 week remaining in plan
        const isDueForReprompt =
          (daysSincePlanCreated > 0 && daysSincePlanCreated % 14 === 0) ||
          weeksRemaining <= 1

        if (!isDueForReprompt) {
          skippedCount++
          continue
        }

        // Check if we already sent a reprompt nudge recently (within 7 days)
        const { data: recentPrompts } = await supabase
          .from('prompt_history')
          .select('created_at')
          .eq('athlete_id', athlete.id)
          .order('created_at', { ascending: false })
          .limit(1)

        if (recentPrompts && recentPrompts.length > 0) {
          const lastPromptDate = new Date(recentPrompts[0].created_at)
          const daysSinceLastPrompt = Math.floor(
            (now.getTime() - lastPromptDate.getTime()) / (1000 * 60 * 60 * 24)
          )

          // Don't nudge if they generated a prompt in the last 3 days
          if (daysSinceLastPrompt < 3) {
            skippedCount++
            continue
          }
        }

        // Send Telegram notification
        const result = await sendMessageWithButtons(
          athlete.telegram_chat_id!,
          `Your plan for the next two weeks is ready to build.\n\nLet's use what you've learned to keep the momentum going.`,
          [
            {
              text: 'Generate prompt',
              url: `${appUrl}/reprompt/${athlete.id}`,
            },
          ]
        )

        if (result.success) {
          notifiedCount++
        } else {
          errors.push(`Failed to notify athlete ${athlete.id}`)
        }
      } catch (err) {
        console.error(`Error processing athlete ${athlete.id}:`, err)
        errors.push(`Error for athlete ${athlete.id}: ${err}`)
      }
    }

    return NextResponse.json({
      message: 'Reprompt check complete',
      notified: notifiedCount,
      skipped: skippedCount,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Error in reprompt check cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
