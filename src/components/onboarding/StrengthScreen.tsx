'use client'

import { OnboardingAnswers } from '@/app/onboard/page'

interface StrengthScreenProps {
  answers: OnboardingAnswers
  updateAnswers: (answers: Partial<OnboardingAnswers>) => void
  onNext: () => void
  onBack: () => void
}

const strengthCurrentOptions = [
  { value: 'yes_regularly', label: 'Yes, regularly' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'no', label: 'No' },
]

const equipmentOptions = [
  { value: 'full_gym', label: 'Full gym' },
  { value: 'dumbbells_kettlebells', label: 'Dumbbells + kettlebells' },
  { value: 'resistance_bands', label: 'Resistance bands' },
  { value: 'bodyweight', label: 'Bodyweight only' },
  { value: 'none', label: "Don't want to do strength" },
]

const timingOptions = [
  { value: 'with_cardio', label: 'With cardio training' },
  { value: 'standalone', label: 'Standalone day' },
  { value: 'recommend', label: 'Recommend for me' },
]

export function StrengthScreen({ answers, updateAnswers, onNext, onBack }: StrengthScreenProps) {
  const canContinue = answers.strengthCurrent && answers.strengthEquipment && answers.strengthTiming

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Strength
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Strength training keeps you durable and fast.
        </p>
      </div>

      {/* Current strength training */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Do you currently do strength training?
        </label>
        <div className="space-y-2">
          {strengthCurrentOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => updateAnswers({ strengthCurrent: option.value })}
              className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                answers.strengthCurrent === option.value
                  ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-900'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="font-medium text-gray-900 dark:text-white">
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Equipment access */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          What equipment do you have access to?
        </label>
        <div className="space-y-2">
          {equipmentOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => updateAnswers({ strengthEquipment: option.value })}
              className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                answers.strengthEquipment === option.value
                  ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-900'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="font-medium text-gray-900 dark:text-white">
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Timing preference */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          How do you want to fit strength in?
        </label>
        <div className="space-y-2">
          {timingOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => updateAnswers({ strengthTiming: option.value })}
              className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                answers.strengthTiming === option.value
                  ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-900'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="font-medium text-gray-900 dark:text-white">
                {option.label}
              </span>
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
