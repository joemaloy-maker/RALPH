'use client'

import { OnboardingAnswers, MotivationMetadata } from '@/app/onboard/page'

interface AlmostDoneScreenProps {
  answers: OnboardingAnswers
  motivationMetadata: MotivationMetadata
  updateAnswers: (answers: Partial<OnboardingAnswers>) => void
  onNext: () => void
  onBack: () => void
}

const planOptions = [
  { value: 'yes', label: 'Yes' },
  { value: 'sort_of', label: 'Sort of' },
  { value: 'no', label: 'No' },
]

export function AlmostDoneScreen({
  answers,
  motivationMetadata,
  updateAnswers,
  onNext,
  onBack,
}: AlmostDoneScreenProps) {
  const canContinue = !!answers.hasExistingPlan

  // Get the driver label for context
  const driverLabel = motivationMetadata.whyTrain?.driver || 'your reason'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Almost done
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Just a few more things to personalize your experience.
        </p>
      </div>

      {/* Why it resonates */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          In a few words, what about &quot;{driverLabel}&quot; resonates?
          <span className="text-gray-400 dark:text-gray-500 font-normal"> (optional)</span>
        </label>
        <input
          type="text"
          value={answers.whyResonates || ''}
          onChange={(e) => updateAnswers({ whyResonates: e.target.value })}
          placeholder="e.g., My kids are watching"
          className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
        />
      </div>

      {/* Anything else */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Anything else we should know?
          <span className="text-gray-400 dark:text-gray-500 font-normal"> (optional)</span>
        </label>
        <textarea
          value={answers.anythingElse || ''}
          onChange={(e) => updateAnswers({ anythingElse: e.target.value })}
          placeholder="e.g., Training for my first race after surgery"
          rows={3}
          className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white resize-none"
        />
      </div>

      {/* Existing plan */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Do you already have a plan?
        </label>
        <div className="flex gap-3">
          {planOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => updateAnswers({ hasExistingPlan: option.value })}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                answers.hasExistingPlan === option.value
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
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
