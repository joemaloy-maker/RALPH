'use client'

import { OnboardingAnswers } from '@/app/onboard/page'

interface WeekScreenProps {
  answers: OnboardingAnswers
  updateAnswers: (answers: Partial<OnboardingAnswers>) => void
  onNext: () => void
  onBack: () => void
}

const daysOptions = ['3', '4', '5', '6']
const hoursOptions = [
  { value: '3-5', label: '3-5 hours' },
  { value: '5-8', label: '5-8 hours' },
  { value: '8-12', label: '8-12 hours' },
  { value: '12+', label: '12+ hours' },
]

export function WeekScreen({ answers, updateAnswers, onNext, onBack }: WeekScreenProps) {
  const canContinue = answers.daysPerWeek && answers.hoursPerWeek

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Your week
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Help us fit training into your life.
        </p>
      </div>

      {/* Days per week */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          How many days per week can you train?
        </label>
        <div className="flex gap-3">
          {daysOptions.map((days) => (
            <button
              key={days}
              onClick={() => updateAnswers({ daysPerWeek: days })}
              className={`flex-1 py-4 rounded-xl font-medium text-lg transition-all ${
                answers.daysPerWeek === days
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {days}
            </button>
          ))}
        </div>
      </div>

      {/* Hours per week */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          How many hours total per week?
        </label>
        <div className="grid grid-cols-2 gap-3">
          {hoursOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => updateAnswers({ hoursPerWeek: option.value })}
              className={`py-4 rounded-xl font-medium transition-all ${
                answers.hoursPerWeek === option.value
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
