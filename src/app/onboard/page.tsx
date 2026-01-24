'use client'

import { useState } from 'react'
import { GoalScreen } from '@/components/onboarding/GoalScreen'
import { WeekScreen } from '@/components/onboarding/WeekScreen'
import { YouScreen } from '@/components/onboarding/YouScreen'
import { FitnessScreen } from '@/components/onboarding/FitnessScreen'
import { StrengthScreen } from '@/components/onboarding/StrengthScreen'
import { MotivationScreen } from '@/components/onboarding/MotivationScreen'
import { AlmostDoneScreen } from '@/components/onboarding/AlmostDoneScreen'
import { ConnectScreen } from '@/components/onboarding/ConnectScreen'

export type GoalType = 'running' | 'triathlon' | 'strength_pt' | 'add_structure' | null

// Motivation metadata stored separately from onboarding answers
export interface MotivationMetadata {
  // Screen 6: Why do you train?
  whyTrain?: {
    selection: string
    driver: string
    witness: string
    prompt_fuel: string
    anti_pattern: string[]
  }
  // Screen 7: When you finish, who do you look for?
  whoLookFor?: {
    selection: string
    witness: string
    validation: string
    prompt_fuel: string
  }
  // Screen 8: Night before the race
  nightBefore?: {
    selection: string
    fear: string
    reframe: string
  }
  // Screen 9: What does your finish line look like?
  finishLine?: {
    selection: string
    success: string
    orientation: string
    session_fuel: string
  }
}

export interface OnboardingAnswers {
  // Screen 1: Goal
  goal: GoalType
  // Running specific
  runningDistance?: string
  raceDate?: string
  // Triathlon specific
  triathlonDistance?: string
  // Strength/PT specific
  strengthPtType?: string
  // Add Structure specific
  currentActivity?: string
  structureGoal?: string
  structureGoalText?: string

  // Screen 2: Your Week
  daysPerWeek?: string
  hoursPerWeek?: string

  // Screen 3: You
  birthdate?: string
  experienceIntent?: string
  injuries?: string

  // Screen 4: Your Fitness (goal-specific)
  // Running
  longestRun?: string
  easyPace?: string
  runningBenchmarks?: string
  // Triathlon
  strongestDiscipline?: string
  longestBrick?: string
  runPaceOffBike?: string
  triathlonBenchmarks?: string
  // Strength/PT
  sessionDuration?: string
  // Add Structure
  hoursActive?: string
  activityIntensity?: string

  // Screen 5: Strength
  strengthCurrent?: string
  strengthEquipment?: string
  strengthTiming?: string

  // Screen 10: Almost Done
  whyResonates?: string
  anythingElse?: string
  hasExistingPlan?: string
}

export default function OnboardPage() {
  const [currentScreen, setCurrentScreen] = useState(1)
  const [answers, setAnswers] = useState<OnboardingAnswers>({ goal: null })
  const [motivationMetadata, setMotivationMetadata] = useState<MotivationMetadata>({})

  const totalScreens = 11

  const updateAnswers = (newAnswers: Partial<OnboardingAnswers>) => {
    setAnswers(prev => ({ ...prev, ...newAnswers }))
  }

  const updateMotivation = (newMotivation: Partial<MotivationMetadata>) => {
    setMotivationMetadata(prev => ({ ...prev, ...newMotivation }))
  }

  const nextScreen = () => {
    setCurrentScreen(prev => Math.min(prev + 1, totalScreens))
  }

  const prevScreen = () => {
    setCurrentScreen(prev => Math.max(prev - 1, 1))
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Progress indicator */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
            <span>Step {currentScreen} of {totalScreens}</span>
            <span>{Math.round((currentScreen / totalScreens) * 100)}%</span>
          </div>
          <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-900 dark:bg-white transition-all duration-300"
              style={{ width: `${(currentScreen / totalScreens) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Screen content */}
      <div className="pt-20 pb-8 px-4">
        <div className="max-w-md mx-auto">
          {currentScreen === 1 && (
            <GoalScreen
              answers={answers}
              updateAnswers={updateAnswers}
              onNext={nextScreen}
            />
          )}
          {currentScreen === 2 && (
            <WeekScreen
              answers={answers}
              updateAnswers={updateAnswers}
              onNext={nextScreen}
              onBack={prevScreen}
            />
          )}
          {currentScreen === 3 && (
            <YouScreen
              answers={answers}
              updateAnswers={updateAnswers}
              onNext={nextScreen}
              onBack={prevScreen}
            />
          )}
          {currentScreen === 4 && (
            <FitnessScreen
              answers={answers}
              updateAnswers={updateAnswers}
              onNext={nextScreen}
              onBack={prevScreen}
            />
          )}
          {currentScreen === 5 && (
            <StrengthScreen
              answers={answers}
              updateAnswers={updateAnswers}
              onNext={nextScreen}
              onBack={prevScreen}
            />
          )}
          {currentScreen === 6 && (
            <MotivationScreen
              screen={6}
              motivationMetadata={motivationMetadata}
              updateMotivation={updateMotivation}
              onNext={nextScreen}
              onBack={prevScreen}
            />
          )}
          {currentScreen === 7 && (
            <MotivationScreen
              screen={7}
              motivationMetadata={motivationMetadata}
              updateMotivation={updateMotivation}
              onNext={nextScreen}
              onBack={prevScreen}
            />
          )}
          {currentScreen === 8 && (
            <MotivationScreen
              screen={8}
              motivationMetadata={motivationMetadata}
              updateMotivation={updateMotivation}
              onNext={nextScreen}
              onBack={prevScreen}
            />
          )}
          {currentScreen === 9 && (
            <MotivationScreen
              screen={9}
              motivationMetadata={motivationMetadata}
              updateMotivation={updateMotivation}
              onNext={nextScreen}
              onBack={prevScreen}
            />
          )}
          {currentScreen === 10 && (
            <AlmostDoneScreen
              answers={answers}
              motivationMetadata={motivationMetadata}
              updateAnswers={updateAnswers}
              onNext={nextScreen}
              onBack={prevScreen}
            />
          )}
          {currentScreen === 11 && (
            <ConnectScreen
              answers={answers}
              motivationMetadata={motivationMetadata}
              onBack={prevScreen}
            />
          )}
        </div>
      </div>
    </div>
  )
}
