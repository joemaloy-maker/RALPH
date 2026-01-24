'use client'

import { OnboardingAnswers } from '@/app/onboard/page'

interface YouScreenProps {
  answers: OnboardingAnswers
  updateAnswers: (answers: Partial<OnboardingAnswers>) => void
  onNext: () => void
  onBack: () => void
}

const experienceOptions = [
  {
    value: 'ambitious_new',
    label: 'Ambitious but new',
    description: "I want to push myself but haven't done structured training",
  },
  {
    value: 'rebuilding',
    label: 'Rebuilding',
    description: "I've done this before, getting back into it",
  },
  {
    value: 'consistent_ready',
    label: 'Consistent, ready for more',
    description: "I've been at it, want to level up",
  },
  {
    value: 'maintaining',
    label: 'Maintaining',
    description: "I'm happy where I am, just want structure",
  },
]

export function YouScreen({ answers, updateAnswers, onNext, onBack }: YouScreenProps) {
  const canContinue = answers.birthdate && answers.experienceIntent

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          You
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          A little about where you&apos;re at.
        </p>
      </div>

      {/* Birthdate */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Birthdate
        </label>
        <input
          type="date"
          value={answers.birthdate || ''}
          onChange={(e) => updateAnswers({ birthdate: e.target.value })}
          className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
        />
      </div>

      {/* Experience/Intent */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Which sounds most like you?
        </label>
        <div className="space-y-3">
          {experienceOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => updateAnswers({ experienceIntent: option.value })}
              className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                answers.experienceIntent === option.value
                  ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-900'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="font-medium text-gray-900 dark:text-white">
                {option.label}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {option.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Injuries */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Any injuries or limitations?
          <span className="text-gray-400 dark:text-gray-500 font-normal"> (optional)</span>
        </label>
        <input
          type="text"
          value={answers.injuries || ''}
          onChange={(e) => updateAnswers({ injuries: e.target.value })}
          placeholder="e.g., tight IT band, recovering from ankle sprain, none"
          className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
        />
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
          disabled={!canContinue}
          className={`flex-1 py-4 rounded-full font-medium transition-all ${
            canContinue
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
