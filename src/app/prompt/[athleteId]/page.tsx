import { createServerClient } from '@/lib/supabase'
import { assemblePrompt } from '@/lib/prompt-builder'
import { PromptDisplay } from './PromptDisplay'
import Link from 'next/link'
import type { OnboardingAnswers, MotivationMetadata, GoalType } from '@/app/onboard/page'

interface PromptPageProps {
  params: Promise<{
    athleteId: string
  }>
}

export default async function PromptPage({ params }: PromptPageProps) {
  const { athleteId } = await params
  const supabase = createServerClient()

  // Fetch athlete data
  const { data: athlete, error } = await supabase
    .from('athletes')
    .select('*')
    .eq('id', athleteId)
    .single()

  if (error || !athlete) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col items-center justify-center p-8">
        <div className="max-w-md text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Athlete not found
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            We couldn&apos;t find an athlete with this ID.
          </p>
          <Link
            href="/"
            className="inline-block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    )
  }

  const answers = athlete.onboarding_answers as unknown as OnboardingAnswers
  const motivationMetadata = athlete.motivation_metadata as unknown as MotivationMetadata
  const goalType = answers.goal as GoalType

  // Check if athlete has an existing plan they might want to sync
  const showSyncBanner = answers.hasExistingPlan === 'Yes' || answers.hasExistingPlan === 'Sort of'

  // Assemble the prompt
  const prompt = assemblePrompt(answers, motivationMetadata, goalType)

  // Save to prompt_history (fire and forget on server)
  supabase
    .from('prompt_history')
    .insert({
      athlete_id: athleteId,
      prompt_text: prompt,
    })
    .then(() => {})

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← Back to home
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">
            Your Training Prompt
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Copy this prompt and paste it into your AI of choice to generate your training plan.
          </p>
        </div>

        {/* Sync banner for athletes with existing plans */}
        {showSyncBanner && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Want to sync your current plan instead?
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  You mentioned you have an existing plan. You can convert it to work with Joe.
                </p>
                <Link
                  href={`/sync/${athleteId}`}
                  className="inline-block mt-3 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  Sync existing plan
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Client component handles interactive parts */}
        <PromptDisplay prompt={prompt} athleteId={athleteId} />
      </div>
    </div>
  )
}
