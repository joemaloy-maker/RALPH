'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MotivationMetadata } from '@/app/onboard/page'
import { supabase } from '@/lib/supabase'

interface ReengageClientProps {
  athleteId: string
  currentMetadata: MotivationMetadata
}

// Screen 6: Why do you train?
const whyTrainOptions = [
  {
    id: 'connection',
    label: 'Family finish line',
    color: 'bg-blue-500',
    metadata: {
      driver: 'connection',
      witness: 'their people',
      prompt_fuel: "They're better because you showed up",
      anti_pattern: ['ego metrics', 'leaderboard language', 'individual glory'],
    },
  },
  {
    id: 'solitude',
    label: 'Solo trail sunrise',
    color: 'bg-green-500',
    metadata: {
      driver: 'solitude',
      witness: 'self',
      prompt_fuel: 'This is where you meet yourself',
      anti_pattern: ['social hooks', 'accountability framing', 'community language'],
    },
  },
  {
    id: 'mastery',
    label: 'Watching data',
    color: 'bg-orange-500',
    metadata: {
      driver: 'mastery',
      witness: 'the data',
      prompt_fuel: "Let's see what's there",
      anti_pattern: ['emotional language', 'feeling-based cues', 'fixed expectations'],
    },
  },
  {
    id: 'identity',
    label: 'Mirror moment',
    color: 'bg-purple-500',
    metadata: {
      driver: 'identity',
      witness: 'self',
      prompt_fuel: 'The statue is in the stone. Keep chipping.',
      anti_pattern: ['external comparison', 'competition framing', 'past-self criticism'],
    },
  },
]

// Screen 7: When you finish, who do you look for?
const whoLookForOptions = [
  {
    id: 'specific_person',
    label: 'One special person',
    color: 'bg-rose-500',
    metadata: {
      witness: 'specific person',
      validation: 'external/relational',
      prompt_fuel: "I want them to see who I've become",
    },
  },
  {
    id: 'self',
    label: 'Just myself',
    color: 'bg-slate-500',
    metadata: {
      witness: 'self',
      validation: 'internal',
      prompt_fuel: "I'll know if it was enough",
    },
  },
  {
    id: 'shared_journey',
    label: 'My training partners',
    color: 'bg-teal-500',
    metadata: {
      witness: 'shared journey',
      validation: 'mutual',
      prompt_fuel: 'They know what this took',
    },
  },
  {
    id: 'everyone',
    label: 'The whole crowd',
    color: 'bg-amber-500',
    metadata: {
      witness: 'everyone',
      validation: 'public',
      prompt_fuel: 'I want them to see I did it',
    },
  },
]

// Screen 8: Night before the race
const nightBeforeOptions = [
  {
    id: 'enough',
    label: 'Did I do enough?',
    color: 'bg-indigo-500',
    metadata: {
      fear: 'did I do enough?',
      reframe: "It's not time for analysis. It's time for execution and discovery.",
    },
  },
  {
    id: 'letting_down',
    label: 'Letting someone down',
    color: 'bg-pink-500',
    metadata: {
      fear: 'letting someone down',
      reframe: 'They want your anticipation, not your anxiety.',
    },
  },
  {
    id: 'belong',
    label: "I don't belong here",
    color: 'bg-cyan-500',
    metadata: {
      fear: "I don't belong here",
      reframe: 'The work reveals the form. Some days take more chipping than others.',
    },
  },
  {
    id: 'fail_publicly',
    label: 'What if I fail publicly?',
    color: 'bg-red-500',
    metadata: {
      fear: 'what if I fail publicly?',
      reframe: "There's no failure in discovery. Only data.",
    },
  },
]

// Screen 9: What does your finish line look like?
const finishLineOptions = [
  {
    id: 'time_goal',
    label: 'Hitting my time',
    color: 'bg-emerald-500',
    metadata: {
      success: 'time goal',
      orientation: 'outcome',
      session_fuel: 'Every rep buys seconds',
    },
  },
  {
    id: 'completion',
    label: 'Just finishing',
    color: 'bg-sky-500',
    metadata: {
      success: 'completion',
      orientation: 'experience',
      session_fuel: 'You just have to get there',
    },
  },
  {
    id: 'shared_moment',
    label: 'Crossing with others',
    color: 'bg-violet-500',
    metadata: {
      success: 'shared moment',
      orientation: 'relational',
      session_fuel: "You're not doing this alone",
    },
  },
  {
    id: 'feeling',
    label: 'The feeling inside',
    color: 'bg-fuchsia-500',
    metadata: {
      success: 'the feeling',
      orientation: 'process',
      session_fuel: 'The race is the reward',
    },
  },
]

const screens = [
  {
    key: 'whyTrain' as const,
    title: 'Why do you train?',
    subtitle: 'Pick the image that resonates most.',
    options: whyTrainOptions,
  },
  {
    key: 'whoLookFor' as const,
    title: 'When you finish, who do you look for?',
    subtitle: 'That moment after the line.',
    options: whoLookForOptions,
  },
  {
    key: 'nightBefore' as const,
    title: "Night before the race, what thought won't leave?",
    subtitle: "We all have one. What's yours?",
    options: nightBeforeOptions,
  },
  {
    key: 'finishLine' as const,
    title: 'What does your finish line look like?',
    subtitle: 'What makes it a success?',
    options: finishLineOptions,
  },
]

export function ReengageClient({ athleteId, currentMetadata }: ReengageClientProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [newMetadata, setNewMetadata] = useState<MotivationMetadata>({
    whyTrain: currentMetadata.whyTrain,
    whoLookFor: currentMetadata.whoLookFor,
    nightBefore: currentMetadata.nightBefore,
    finishLine: currentMetadata.finishLine,
  })
  const [saving, setSaving] = useState(false)
  const [complete, setComplete] = useState(false)
  const [changesDetected, setChangesDetected] = useState(false)

  const screen = screens[step]
  const currentSelection = newMetadata[screen.key]?.selection
  const previousSelection = currentMetadata[screen.key]?.selection

  const handleSelect = (option: typeof screen.options[number]) => {
    const updated = {
      ...newMetadata,
      [screen.key]: {
        selection: option.id,
        ...option.metadata,
      },
    }
    setNewMetadata(updated)

    // Check if any changes from original
    const hasChanges = screens.some((s) => {
      const newSel = s.key === screen.key ? option.id : updated[s.key]?.selection
      const oldSel = currentMetadata[s.key]?.selection
      return newSel !== oldSel
    })
    setChangesDetected(hasChanges)
  }

  const handleNext = () => {
    if (step < screens.length - 1) {
      setStep(step + 1)
    } else {
      handleSave()
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      // Update motivation_metadata
      const { error } = await supabase
        .from('athletes')
        .update({
          motivation_metadata: newMetadata as never,
        })
        .eq('id', athleteId)

      if (error) {
        throw error
      }

      // Log the change for analytics
      console.log('Motivation change:', {
        athleteId,
        changed: changesDetected,
        old: {
          whyTrain: currentMetadata.whyTrain?.selection,
          whoLookFor: currentMetadata.whoLookFor?.selection,
          nightBefore: currentMetadata.nightBefore?.selection,
          finishLine: currentMetadata.finishLine?.selection,
        },
        new: {
          whyTrain: newMetadata.whyTrain?.selection,
          whoLookFor: newMetadata.whoLookFor?.selection,
          nightBefore: newMetadata.nightBefore?.selection,
          finishLine: newMetadata.finishLine?.selection,
        },
      })

      setComplete(true)
    } catch (err) {
      console.error('Error saving motivation:', err)
      setSaving(false)
    }
  }

  // Completion screen
  if (complete) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col items-center justify-center p-8">
        <div className="max-w-md text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Got it.
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {changesDetected
              ? 'Your cues will feel different now.'
              : "Same choices - that's good data. The motivation is solid."}
          </p>

          <div className="space-y-3 pt-4">
            <button
              onClick={() => router.push(`/reprompt/${athleteId}`)}
              className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              Generate fresh plan
            </button>
            <button
              onClick={() => router.push(`/plan/${athleteId}`)}
              className="w-full py-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
            >
              Continue current plan
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-lg mx-auto px-4 py-12">
        {/* Progress indicator */}
        <div className="flex gap-2 mb-8">
          {screens.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step
                  ? 'bg-gray-900 dark:bg-white'
                  : 'bg-gray-200 dark:bg-gray-800'
              }`}
            />
          ))}
        </div>

        {/* Screen content */}
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {screen.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{screen.subtitle}</p>
          </div>

          {/* 2x2 Image Grid */}
          <div className="grid grid-cols-2 gap-3">
            {screen.options.map((option) => {
              const isSelected = currentSelection === option.id
              const wasPrevious = previousSelection === option.id && !isSelected

              return (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option)}
                  className={`relative aspect-square rounded-2xl transition-all ${option.color} ${
                    isSelected
                      ? 'ring-4 ring-gray-900 dark:ring-white ring-offset-2 dark:ring-offset-gray-950 scale-[0.98]'
                      : 'hover:scale-[0.98]'
                  }`}
                >
                  {/* Label */}
                  <div className="absolute inset-0 flex items-end justify-center p-3">
                    <span className="text-white text-sm font-medium text-center drop-shadow-lg bg-black/20 px-2 py-1 rounded-lg">
                      {option.label}
                    </span>
                  </div>

                  {/* Previous selection indicator */}
                  {wasPrevious && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/40 rounded text-xs text-white/80">
                      Previous
                    </div>
                  )}

                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-gray-900"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Navigation */}
          <div className="flex gap-3 pt-4">
            {step > 0 && (
              <button
                onClick={handleBack}
                className="px-6 py-4 rounded-full font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                ← Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!currentSelection || saving}
              className={`flex-1 py-4 rounded-full font-medium transition-all ${
                currentSelection && !saving
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
              }`}
            >
              {saving
                ? 'Saving...'
                : step === screens.length - 1
                  ? 'Save'
                  : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
