'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingAnswers, MotivationMetadata } from '@/app/onboard/page'
import { supabase } from '@/lib/supabase'
import type { Json } from '@/types/database'

interface ConnectScreenProps {
  answers: OnboardingAnswers
  motivationMetadata: MotivationMetadata
  onBack: () => void
}

export function ConnectScreen({
  answers,
  motivationMetadata,
  onBack,
}: ConnectScreenProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Format goal display
  const getGoalDisplay = () => {
    switch (answers.goal) {
      case 'running':
        return `Running: ${answers.runningDistance || 'Race'}`
      case 'triathlon':
        return `Triathlon: ${answers.triathlonDistance || 'Race'}`
      case 'strength_pt':
        return 'Strength / PT'
      case 'add_structure':
        return 'Add structure'
      default:
        return 'Training'
    }
  }

  const saveAthlete = async (connectTelegram: boolean) => {
    setSaving(true)
    setError(null)

    try {
      // Insert athlete record
      const { data, error: insertError } = await supabase
        .from('athletes')
        .insert({
          onboarding_answers: answers as unknown as Json,
          motivation_metadata: motivationMetadata as unknown as Json,
          telegram_chat_id: null,
        })
        .select('id')
        .single()

      if (insertError) {
        throw insertError
      }

      const athleteId = data.id

      if (connectTelegram) {
        // Open Telegram deep link
        const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'JoeCoachBot'
        window.open(`https://t.me/${botUsername}?start=${athleteId}`, '_blank')
      }

      // Redirect to prompt page
      router.push(`/prompt/${athleteId}`)
    } catch (err) {
      console.error('Error saving athlete:', err)
      setError('Failed to save your profile. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          You&apos;re all set
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here&apos;s a summary of your profile.
        </p>
      </div>

      {/* Summary card */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">Goal</span>
          <span className="font-medium text-gray-900 dark:text-white">{getGoalDisplay()}</span>
        </div>

        {answers.raceDate && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">Race date</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {new Date(answers.raceDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">Days/week</span>
          <span className="font-medium text-gray-900 dark:text-white">{answers.daysPerWeek}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">Your driver</span>
          <span className="font-medium text-gray-900 dark:text-white capitalize">
            {motivationMetadata.whyTrain?.driver || 'Not set'}
          </span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Telegram connection */}
      <div className="space-y-3">
        <button
          onClick={() => saveAthlete(true)}
          disabled={saving}
          className={`w-full py-4 rounded-full font-medium transition-all ${
            saving
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
          }`}
        >
          {saving ? 'Saving...' : 'Connect Telegram'}
        </button>

        <button
          onClick={() => saveAthlete(false)}
          disabled={saving}
          className={`w-full py-4 rounded-full font-medium transition-all ${
            saving
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Continue without Telegram
        </button>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Telegram lets us send your daily sessions and collect feedback.
        </p>
      </div>

      {/* Back button */}
      <div className="pt-2">
        <button
          onClick={onBack}
          disabled={saving}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          ← Back
        </button>
      </div>
    </div>
  )
}
