import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendMessageWithButtons } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

// Configurable thresholds
const DORMANT_DAYS = 7 // Days without activity to be considered dormant
const MIN_DAYS_BETWEEN_REENGAGEMENT = 30 // Don't spam - wait at least 30 days

/**
 * GET /api/cron/dormant-check
 *
 * Called daily to check for dormant athletes and send re-engagement messages.
 * An athlete is dormant if:
 * - Has telegram connected
 * - Last session completed > 7 days ago
 * - Hasn't received re-engagement message in 30 days
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
  const now = new Date()

  try {
    // Get all athletes with telegram connected
    const { data: athletes, error: athletesError } = await supabase
      .from('athletes')
      .select('id, telegram_chat_id, last_reengagement_sent, reengagement_count')
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
        // Check if we've sent re-engagement recently
        if (athlete.last_reengagement_sent) {
          const lastSent = new Date(athlete.last_reengagement_sent)
          const daysSinceLastReengagement = Math.floor(
            (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24)
          )

          if (daysSinceLastReengagement < MIN_DAYS_BETWEEN_REENGAGEMENT) {
            skippedCount++
            continue
          }
        }

        // Get the athlete's plans to find sessions
        const { data: plans } = await supabase
          .from('plans')
          .select('id')
          .eq('athlete_id', athlete.id)

        if (!plans || plans.length === 0) {
          skippedCount++
          continue
        }

        const planIds = plans.map((p) => p.id)

        // Get most recent completed session
        const { data: recentSession } = await supabase
          .from('sessions')
          .select('completed_at')
          .in('plan_id', planIds)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(1)
          .single()

        // Check if dormant
        let isDormant = false

        if (!recentSession) {
          // No completed sessions at all - check if they have any plan
          // They might be dormant if plan was created > DORMANT_DAYS ago
          const { data: latestPlan } = await supabase
            .from('plans')
            .select('created_at')
            .eq('athlete_id', athlete.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          if (latestPlan) {
            const planCreated = new Date(latestPlan.created_at)
            const daysSincePlanCreated = Math.floor(
              (now.getTime() - planCreated.getTime()) / (1000 * 60 * 60 * 24)
            )
            isDormant = daysSincePlanCreated > DORMANT_DAYS
          }
        } else {
          const lastCompleted = new Date(recentSession.completed_at!)
          const daysSinceLastSession = Math.floor(
            (now.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24)
          )
          isDormant = daysSinceLastSession > DORMANT_DAYS
        }

        if (!isDormant) {
          skippedCount++
          continue
        }

        // Send re-engagement message
        const result = await sendMessageWithButtons(
          athlete.telegram_chat_id!,
          `Hey. You've been quiet. That's okay—life happens.

But sometimes it means we didn't get the why right.

Want to try again?`,
          [
            {
              text: 'Re-pick your images',
              url: `${appUrl}/reengage/${athlete.id}`,
            },
          ]
        )

        if (result.success) {
          // Update athlete record
          await supabase
            .from('athletes')
            .update({
              last_reengagement_sent: now.toISOString(),
              reengagement_count: (athlete.reengagement_count || 0) + 1,
            })
            .eq('id', athlete.id)

          notifiedCount++
        } else if (result.blocked) {
          // User blocked bot, skip them
          skippedCount++
        } else {
          errors.push(`Failed to notify athlete ${athlete.id}`)
        }
      } catch (err) {
        console.error(`Error processing athlete ${athlete.id}:`, err)
        errors.push(`Error for athlete ${athlete.id}: ${err}`)
      }
    }

    return NextResponse.json({
      message: 'Dormant check complete',
      notified: notifiedCount,
      skipped: skippedCount,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Error in dormant check cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
