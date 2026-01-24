'use client'

import { OnboardingAnswers, GoalType } from '@/app/onboard/page'

interface GoalScreenProps {
  answers: OnboardingAnswers
  updateAnswers: (answers: Partial<OnboardingAnswers>) => void
  onNext: () => void
}

const goalOptions: { value: GoalType; label: string }[] = [
  { value: 'running', label: 'Running race' },
  { value: 'triathlon', label: 'Triathlon' },
  { value: 'strength_pt', label: 'Strength / Recovery / PT compliance' },
  { value: 'add_structure', label: 'Add structure to what I\'m already doing' },
]

const runningDistances = ['5K', '10K', 'Half Marathon', 'Marathon', 'Custom']
const triathlonDistances = ['Sprint', 'Olympic', '70.3', 'Full Ironman', 'Custom']
const strengthPtTypes = [
  'PT exercises from physio',
  'Strength routine I\'ve neglected',
  'Mobility/recovery work',
  'Nothing yet, build me something',
]
const currentActivities = [
  'Peloton/spin',
  'Group fitness (OTF, F45, CrossFit, Barry\'s)',
  'Gym workouts',
  'YouTube/app workouts',
  'Mix of everything',
]
const structureGoals = [
  { value: 'race', label: 'A race' },
  { value: 'general', label: 'General fitness with purpose' },
  { value: 'specific', label: 'Specific outcome' },
]

export function GoalScreen({ answers, updateAnswers, onNext }: GoalScreenProps) {
  const canContinue = () => {
    if (!answers.goal) return false

    if (answers.goal === 'running') {
      return answers.runningDistance && answers.raceDate
    }
    if (answers.goal === 'triathlon') {
      return answers.triathlonDistance && answers.raceDate
    }
    if (answers.goal === 'strength_pt') {
      return !!answers.strengthPtType
    }
    if (answers.goal === 'add_structure') {
      if (!answers.currentActivity || !answers.structureGoal) return false
      if (answers.structureGoal === 'race') {
        return !!answers.runningDistance
      }
      if (answers.structureGoal === 'specific') {
        return !!answers.structureGoalText
      }
      return true
    }
    return true
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          What&apos;s your goal?
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          This helps us build the right plan for you.
        </p>
      </div>

      {/* Goal selection */}
      <div className="space-y-3">
        {goalOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => updateAnswers({
              goal: option.value,
              // Reset conditional fields when goal changes
              runningDistance: undefined,
              triathlonDistance: undefined,
              raceDate: undefined,
              strengthPtType: undefined,
              currentActivity: undefined,
              structureGoal: undefined,
              structureGoalText: undefined,
            })}
            className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
              answers.goal === option.value
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

      {/* Running conditional */}
      {answers.goal === 'running' && (
        <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              What distance?
            </label>
            <div className="flex flex-wrap gap-2">
              {runningDistances.map((distance) => (
                <button
                  key={distance}
                  onClick={() => updateAnswers({ runningDistance: distance })}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    answers.runningDistance === distance
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {distance}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              When is your race?
            </label>
            <input
              type="date"
              value={answers.raceDate || ''}
              onChange={(e) => updateAnswers({ raceDate: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>
        </div>
      )}

      {/* Triathlon conditional */}
      {answers.goal === 'triathlon' && (
        <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              What distance?
            </label>
            <div className="flex flex-wrap gap-2">
              {triathlonDistances.map((distance) => (
                <button
                  key={distance}
                  onClick={() => updateAnswers({ triathlonDistance: distance })}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    answers.triathlonDistance === distance
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {distance}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              When is your race?
            </label>
            <input
              type="date"
              value={answers.raceDate || ''}
              onChange={(e) => updateAnswers({ raceDate: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>
        </div>
      )}

      {/* Strength/PT conditional */}
      {answers.goal === 'strength_pt' && (
        <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              What do you have?
            </label>
            <div className="space-y-2">
              {strengthPtTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => updateAnswers({ strengthPtType: type })}
                  className={`w-full p-3 text-left rounded-xl border transition-all ${
                    answers.strengthPtType === type
                      ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-900'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <span className="text-gray-900 dark:text-white">{type}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Structure conditional */}
      {answers.goal === 'add_structure' && (
        <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              What are you currently doing?
            </label>
            <div className="space-y-2">
              {currentActivities.map((activity) => (
                <button
                  key={activity}
                  onClick={() => updateAnswers({ currentActivity: activity })}
                  className={`w-full p-3 text-left rounded-xl border transition-all ${
                    answers.currentActivity === activity
                      ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-900'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <span className="text-gray-900 dark:text-white">{activity}</span>
                </button>
              ))}
            </div>
          </div>

          {answers.currentActivity && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                What do you want to work toward?
              </label>
              <div className="space-y-2">
                {structureGoals.map((goal) => (
                  <button
                    key={goal.value}
                    onClick={() => updateAnswers({
                      structureGoal: goal.value,
                      runningDistance: undefined,
                      structureGoalText: undefined,
                    })}
                    className={`w-full p-3 text-left rounded-xl border transition-all ${
                      answers.structureGoal === goal.value
                        ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-900'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <span className="text-gray-900 dark:text-white">{goal.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Race distance picker for "A race" option */}
          {answers.structureGoal === 'race' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                What distance?
              </label>
              <div className="flex flex-wrap gap-2">
                {runningDistances.map((distance) => (
                  <button
                    key={distance}
                    onClick={() => updateAnswers({ runningDistance: distance })}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      answers.runningDistance === distance
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {distance}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Free text for "Specific outcome" option */}
          {answers.structureGoal === 'specific' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What outcome are you working toward?
              </label>
              <input
                type="text"
                value={answers.structureGoalText || ''}
                onChange={(e) => updateAnswers({ structureGoalText: e.target.value })}
                placeholder="e.g., Complete a pull-up, run a 5K without stopping"
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
              />
            </div>
          )}
        </div>
      )}

      {/* Continue button */}
      <div className="pt-4">
        <button
          onClick={onNext}
          disabled={!canContinue()}
          className={`w-full py-4 rounded-full font-medium transition-all ${
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
