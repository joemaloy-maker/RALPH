import { createServerClient } from '@/lib/supabase'
import { buildRepromptPrompt } from '@/lib/prompt-builder'
import { getRecentFeedback } from '@/lib/feedback-aggregator'
import { getCurrentWeekNumber } from '@/lib/weekly-kickoff'
import { RepromptClient } from './RepromptClient'
import { OnboardingAnswers, MotivationMetadata, GoalType } from '@/app/onboard/page'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ athleteId: string }>
}

export default async function RepromptPage({ params }: PageProps) {
  const { athleteId } = await params
  const supabase = createServerClient()

  // Fetch athlete
  const { data: athlete, error: athleteError } = await supabase
    .from('athletes')
    .select('*')
    .eq('id', athleteId)
    .single()

  if (athleteError || !athlete) {
    notFound()
  }

  // Fetch latest plan
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  if (planError || !plan) {
    notFound()
  }

  const answers = athlete.onboarding_answers as unknown as OnboardingAnswers
  const metadata = athlete.motivation_metadata as unknown as MotivationMetadata
  const goalType = (answers?.goal || 'running') as GoalType

  // Get current week number
  const weeks = plan.weeks as unknown as Array<{ week_number: number }>
  const currentWeekNumber = getCurrentWeekNumber(plan.created_at, weeks?.length || 1)

  // Get feedback from recent weeks
  const { summary: feedbackSummary } = await getRecentFeedback(athleteId, 2)

  // Build the re-prompt
  const prompt = buildRepromptPrompt(
    answers,
    metadata,
    goalType,
    feedbackSummary,
    currentWeekNumber,
    2 // Generate 2 weeks
  )

  // Save to prompt_history
  await supabase.from('prompt_history').insert({
    athlete_id: athleteId,
    prompt_text: prompt,
    feedback_summary: feedbackSummary as never,
  })

  return (
    <RepromptClient
      prompt={prompt}
      athleteId={athleteId}
      feedbackSummary={feedbackSummary}
      currentWeekNumber={currentWeekNumber}
    />
  )
}
