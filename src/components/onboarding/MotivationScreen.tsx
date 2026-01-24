'use client'

import { MotivationMetadata } from '@/app/onboard/page'

interface MotivationScreenProps {
  screen: 6 | 7 | 8 | 9
  motivationMetadata: MotivationMetadata
  updateMotivation: (metadata: Partial<MotivationMetadata>) => void
  onNext: () => void
  onBack: () => void
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

const screenConfig = {
  6: {
    title: 'Why do you train?',
    subtitle: 'Pick the image that resonates most.',
    options: whyTrainOptions,
    metadataKey: 'whyTrain' as const,
  },
  7: {
    title: 'When you finish, who do you look for?',
    subtitle: 'That moment after the line.',
    options: whoLookForOptions,
    metadataKey: 'whoLookFor' as const,
  },
  8: {
    title: "Night before the race, what thought won't leave?",
    subtitle: "We all have one. What's yours?",
    options: nightBeforeOptions,
    metadataKey: 'nightBefore' as const,
  },
  9: {
    title: 'What does your finish line look like?',
    subtitle: 'What makes it a success?',
    options: finishLineOptions,
    metadataKey: 'finishLine' as const,
  },
}

export function MotivationScreen({
  screen,
  motivationMetadata,
  updateMotivation,
  onNext,
  onBack,
}: MotivationScreenProps) {
  const config = screenConfig[screen]
  const currentValue = motivationMetadata[config.metadataKey]?.selection

  const handleSelect = (option: typeof config.options[number]) => {
    updateMotivation({
      [config.metadataKey]: {
        selection: option.id,
        ...option.metadata,
      },
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {config.title}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {config.subtitle}
        </p>
      </div>

      {/* 2x2 Image Grid */}
      <div className="grid grid-cols-2 gap-3">
        {config.options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelect(option)}
            className={`relative aspect-square rounded-2xl transition-all ${option.color} ${
              currentValue === option.id
                ? 'ring-4 ring-gray-900 dark:ring-white ring-offset-2 dark:ring-offset-gray-950 scale-[0.98]'
                : 'hover:scale-[0.98]'
            }`}
          >
            {/* Placeholder colored box with label */}
            <div className="absolute inset-0 flex items-end justify-center p-3">
              <span className="text-white text-sm font-medium text-center drop-shadow-lg bg-black/20 px-2 py-1 rounded-lg">
                {option.label}
              </span>
            </div>
            {/* Selection indicator */}
            {currentValue === option.id && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="px-6 py-4 rounded-full font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!currentValue}
          className={`flex-1 py-4 rounded-full font-medium transition-all ${
            currentValue
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
