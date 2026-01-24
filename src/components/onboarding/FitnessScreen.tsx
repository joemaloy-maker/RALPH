'use client'

import { OnboardingAnswers } from '@/app/onboard/page'

interface FitnessScreenProps {
  answers: OnboardingAnswers
  updateAnswers: (answers: Partial<OnboardingAnswers>) => void
  onNext: () => void
  onBack: () => void
}

const longestRunOptions = ['3 miles or less', '5 miles', '10 miles', '13+ miles']
const paceOptions = [
  'Faster than 8:00/mile',
  '8:00-9:00',
  '9:00-10:00',
  '10:00-11:00',
  'Slower than 11:00',
  'Not sure',
]
const disciplineOptions = ['Swim', 'Bike', 'Run', 'All similar']
const brickOptions = ['Under 1 hour', '1-2 hours', '2-3 hours', '3+ hours']
const sessionDurationOptions = [
  'Under 15 min',
  '15-30 min',
  '30-45 min',
  '45+ min',
  "I don't do them (that's the problem)",
]
const hoursActiveOptions = ['1-2 hours', '3-4 hours', '5-6 hours', '7+ hours']
const intensityOptions = ['Easy/low', 'Moderate', 'Hard/HIIT', 'Mixed']

export function FitnessScreen({ answers, updateAnswers, onNext, onBack }: FitnessScreenProps) {
  const canContinue = () => {
    if (answers.goal === 'running') {
      return answers.longestRun && answers.easyPace
    }
    if (answers.goal === 'triathlon') {
      return answers.strongestDiscipline && answers.longestBrick && answers.runPaceOffBike
    }
    if (answers.goal === 'strength_pt') {
      return !!answers.sessionDuration
    }
    if (answers.goal === 'add_structure') {
      return answers.hoursActive && answers.activityIntensity
    }
    return true
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Your fitness
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Help us understand where you&apos;re starting from.
        </p>
      </div>

      {/* Running-specific questions */}
      {answers.goal === 'running' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Longest run in the past month?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {longestRunOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => updateAnswers({ longestRun: option })}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                    answers.longestRun === option
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              What pace feels easy?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {paceOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => updateAnswers({ easyPace: option })}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                    answers.easyPace === option
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Help us understand your range:
              <span className="text-gray-400 dark:text-gray-500 font-normal"> (optional)</span>
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Tell us:<br />
              • Recent PRs (e.g., &apos;22:00 5K, 1:45 half&apos;)<br />
              • Your top-end speed (e.g., &apos;can hold 7:00 pace for a mile&apos;)<br />
              • Any gaps you know about (e.g., &apos;fast but no endurance&apos;)
            </p>
            <textarea
              value={answers.runningBenchmarks || ''}
              onChange={(e) => updateAnswers({ runningBenchmarks: e.target.value })}
              placeholder="e.g., PR is 24:00 5K from last year. Can hit 6:45 for 400m but die after. Need endurance."
              rows={4}
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white resize-none"
            />
          </div>
        </div>
      )}

      {/* Triathlon-specific questions */}
      {answers.goal === 'triathlon' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Strongest discipline?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {disciplineOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => updateAnswers({ strongestDiscipline: option })}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                    answers.strongestDiscipline === option
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Longest brick or multi-sport session recently?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {brickOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => updateAnswers({ longestBrick: option })}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                    answers.longestBrick === option
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              What&apos;s your run pace off the bike?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {paceOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => updateAnswers({ runPaceOffBike: option })}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                    answers.runPaceOffBike === option
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Help us understand your range:
              <span className="text-gray-400 dark:text-gray-500 font-normal"> (optional)</span>
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Tell us: Recent PRs or race times, your top-end in each discipline, any gaps (e.g., &apos;strong cyclist, weak swimmer&apos;)
            </p>
            <textarea
              value={answers.triathlonBenchmarks || ''}
              onChange={(e) => updateAnswers({ triathlonBenchmarks: e.target.value })}
              placeholder="e.g., Did a 70.3 last year in 5:45. Strong cyclist, average swimmer. Run falls apart in the heat."
              rows={4}
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white resize-none"
            />
          </div>
        </div>
      )}

      {/* Strength/PT-specific questions */}
      {answers.goal === 'strength_pt' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              How long are your current sessions (when you do them)?
            </label>
            <div className="space-y-2">
              {sessionDurationOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => updateAnswers({ sessionDuration: option })}
                  className={`w-full p-3 text-left rounded-xl border transition-all ${
                    answers.sessionDuration === option
                      ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-900'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <span className="text-gray-900 dark:text-white">{option}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Structure-specific questions */}
      {answers.goal === 'add_structure' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              How many hours per week are you currently active?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {hoursActiveOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => updateAnswers({ hoursActive: option })}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                    answers.hoursActive === option
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              What intensity is most of it?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {intensityOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => updateAnswers({ activityIntensity: option })}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                    answers.activityIntensity === option
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
          disabled={!canContinue()}
          className={`flex-1 py-4 rounded-full font-medium transition-all ${
            canContinue()
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
