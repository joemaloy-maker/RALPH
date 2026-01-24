'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { validatePlan, getWeekPreview, ValidationResult } from '@/lib/plan-validator'
import { supabase } from '@/lib/supabase'

interface RepromptContext {
  isReprompt: boolean
  currentWeekNumber: number
}

interface ValidateClientProps {
  athleteId: string
}

export function ValidateClient({ athleteId }: ValidateClientProps) {
  const router = useRouter()
  const [planText, setPlanText] = useState<string | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [repromptContext, setRepromptContext] = useState<RepromptContext | null>(null)

  useEffect(() => {
    // Get plan from sessionStorage
    const storedPlan = sessionStorage.getItem('pendingPlan')
    const storedContext = sessionStorage.getItem('repromptContext')

    if (storedPlan) {
      setPlanText(storedPlan)
      const result = validatePlan(storedPlan)
      setValidation(result)
      // Clear sessionStorage after reading
      sessionStorage.removeItem('pendingPlan')
    }

    if (storedContext) {
      try {
        setRepromptContext(JSON.parse(storedContext))
      } catch {
        // Ignore invalid JSON
      }
      sessionStorage.removeItem('repromptContext')
    }
  }, [])

  const copyRepairPrompt = async () => {
    if (validation?.repairPrompt) {
      await navigator.clipboard.writeText(validation.repairPrompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const savePlan = async () => {
    if (!validation?.plan) return

    setSaving(true)
    setError(null)

    try {
      if (repromptContext?.isReprompt) {
        // Fetch existing plan to append weeks
        const { data: existingPlan, error: fetchError } = await supabase
          .from('plans')
          .select('id, version, weeks, macro_plan')
          .eq('athlete_id', athleteId)
          .order('version', { ascending: false })
          .limit(1)
          .single()

        if (fetchError || !existingPlan) {
          throw new Error('Could not fetch existing plan')
        }

        // Append new weeks to existing weeks
        const existingWeeks = (existingPlan.weeks as unknown as unknown[]) || []
        const newWeeks = validation.plan.weeks || []
        const combinedWeeks = [...existingWeeks, ...newWeeks]

        // Create new plan version with appended weeks
        const { error: insertError } = await supabase
          .from('plans')
          .insert({
            athlete_id: athleteId,
            version: existingPlan.version + 1,
            macro_plan: validation.plan.macro_plan || existingPlan.macro_plan,
            weeks: combinedWeeks,
          })

        if (insertError) {
          throw insertError
        }
      } else {
        // New plan - insert as version 1
        const { error: insertError } = await supabase
          .from('plans')
          .insert({
            athlete_id: athleteId,
            version: 1,
            macro_plan: validation.plan.macro_plan || null,
            weeks: validation.plan.weeks,
          })

        if (insertError) {
          throw insertError
        }
      }

      router.push(`/plan/${athleteId}`)
    } catch (err) {
      console.error('Error saving plan:', err)
      setError('Failed to save plan. Please try again.')
      setSaving(false)
    }
  }

  // No plan provided
  if (planText === null) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col items-center justify-center p-8">
        <div className="max-w-md text-center space-y-6">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-amber-600 dark:text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            No plan to validate
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please paste your plan on the prompt page first.
          </p>
          <Link
            href={`/prompt/${athleteId}`}
            className="inline-block px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Go to prompt page
          </Link>
        </div>
      </div>
    )
  }

  // Still loading validation
  if (!validation) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Validating plan...</div>
      </div>
    )
  }

  // Invalid plan (Tier 3)
  if (!validation.valid) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Link
            href={`/prompt/${athleteId}`}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← Back to prompt
          </Link>

          <div className="mt-8 space-y-6">
            {/* Error header */}
            <div className="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-red-600 dark:text-red-400"
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
              <div>
                <h1 className="text-lg font-semibold text-red-800 dark:text-red-200">
                  Plan validation failed
                </h1>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  The plan has issues that need to be fixed before saving.
                </p>
              </div>
            </div>

            {/* Errors list */}
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Errors found:
              </h2>
              <ul className="space-y-2">
                {validation.errors.map((err, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300"
                  >
                    <span className="text-red-500">•</span>
                    {err}
                  </li>
                ))}
              </ul>
            </div>

            {/* Repair prompt */}
            {validation.repairPrompt && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Send this back to the AI:
                  </h2>
                  <button
                    onClick={copyRepairPrompt}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                      copied
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {validation.repairPrompt}
                </pre>
              </div>
            )}

            {/* Try again button */}
            <Link
              href={`/prompt/${athleteId}`}
              className="inline-block w-full text-center py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              Try again
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Valid plan (Tier 1 or 2)
  const weekPreview = validation.plan?.weeks?.[0]
    ? getWeekPreview(validation.plan.weeks[0])
    : []

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href={repromptContext?.isReprompt ? `/reprompt/${athleteId}` : `/prompt/${athleteId}`}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          ← Back to prompt
        </Link>

        <div className="mt-8 space-y-6">
          {/* Success header */}
          <div className="flex items-start gap-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-green-800 dark:text-green-200">
                {repromptContext?.isReprompt
                  ? 'New weeks validated successfully'
                  : 'Plan validated successfully'}
              </h1>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {repromptContext?.isReprompt
                  ? 'Ready to add these weeks to your plan.'
                  : validation.tier === 1
                    ? 'No issues found. Ready to save!'
                    : 'Plan is valid with minor warnings.'}
              </p>
            </div>
          </div>

          {/* Warnings */}
          {validation.warnings.length > 0 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <h2 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                Warnings:
              </h2>
              <ul className="space-y-1">
                {validation.warnings.map((warning, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300"
                  >
                    <span className="text-amber-500">•</span>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Week 1 Preview */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Week 1 Preview
            </h2>
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              {weekPreview.map((day, i) => (
                <div
                  key={day.day}
                  className={`p-4 ${
                    i !== weekPreview.length - 1
                      ? 'border-b border-gray-200 dark:border-gray-800'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {day.day}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {day.session}
                      </div>
                    </div>
                    {day.cue && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 italic text-right max-w-[200px]">
                        &quot;{day.cue}&quot;
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {weekPreview.length === 0 && (
                <div className="p-4 text-gray-500 dark:text-gray-400 text-center">
                  No days found in week 1
                </div>
              )}
            </div>
          </div>

          {/* Save error */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Save button */}
          <button
            onClick={savePlan}
            disabled={saving}
            className={`w-full py-4 rounded-full font-medium transition-all ${
              saving
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
            }`}
          >
            {saving
              ? 'Saving...'
              : repromptContext?.isReprompt
                ? 'Add Weeks to Plan'
                : 'Save Plan'}
          </button>
        </div>
      </div>
    </div>
  )
}
