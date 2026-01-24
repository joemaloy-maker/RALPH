'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Athlete, Plan } from '@/types/database'

interface PlanClientProps {
  athlete: Athlete
  plan: Plan
}

interface DaySession {
  session_type: string
  title?: string
  duration_minutes?: number
  cue?: string
  structure?: Array<{
    type: string
    minutes?: number
    description?: string
    reps?: number
    rep_duration?: string
    intensity?: string
  }>
  strength?: {
    timing: string
    duration_minutes?: number | null
    focus?: string | null
    exercises?: string[] | null
  }
}

interface Week {
  week_number: number
  phase?: string
  focus?: string
  days: Record<string, DaySession>
}

const sessionTypeIcons: Record<string, { icon: string; color: string }> = {
  run: { icon: '🏃', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
  bike: { icon: '🚴', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
  swim: { icon: '🏊', color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300' },
  brick: { icon: '🔥', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
  strength: { icon: '💪', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
  rest: { icon: '😴', color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' },
  cross: { icon: '⚡', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' },
}

const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export function PlanClient({ athlete, plan }: PlanClientProps) {
  const weeks = (plan.weeks as unknown as Week[]) || []
  const [selectedWeek, setSelectedWeek] = useState(0)
  const [selectedSession, setSelectedSession] = useState<{ day: string; session: DaySession } | null>(null)

  // Parse onboarding answers
  const answers = athlete.onboarding_answers as Record<string, string> | null

  // Get goal display text
  const getGoalText = () => {
    if (!answers) return 'Training Plan'
    const { goal, runningDistance, triathlonDistance, raceDate } = answers

    if (goal === 'running' && runningDistance) {
      const dateStr = raceDate ? ` on ${formatDate(raceDate)}` : ''
      return `${runningDistance}${dateStr}`
    }
    if (goal === 'triathlon' && triathlonDistance) {
      const dateStr = raceDate ? ` on ${formatDate(raceDate)}` : ''
      return `${triathlonDistance} Triathlon${dateStr}`
    }
    if (goal === 'strength_pt') {
      return 'Strength & Recovery'
    }
    if (goal === 'add_structure') {
      return 'Structured Training'
    }
    return 'Training Plan'
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const currentWeek = weeks[selectedWeek]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {getGoalText()}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Plan v{plan.version}
              </p>
            </div>
            <Link
              href="/"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Home
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Week Navigation */}
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-2 pb-2">
            {weeks.map((week, index) => (
              <button
                key={week.week_number}
                onClick={() => setSelectedWeek(index)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedWeek === index
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Week {week.week_number}
              </button>
            ))}
          </div>
        </div>

        {/* Week Info */}
        {currentWeek && (currentWeek.phase || currentWeek.focus) && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
            {currentWeek.phase && (
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Phase: {currentWeek.phase}
              </p>
            )}
            {currentWeek.focus && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {currentWeek.focus}
              </p>
            )}
          </div>
        )}

        {/* Day Cards */}
        <div className="space-y-3">
          {currentWeek && dayOrder.map((dayName) => {
            const session = currentWeek.days?.[dayName]
            if (!session) return null

            const typeInfo = sessionTypeIcons[session.session_type] || sessionTypeIcons.cross
            const hasStrength = session.strength?.timing && session.strength.timing !== 'none'

            return (
              <button
                key={dayName}
                onClick={() => setSelectedSession({ day: dayName, session })}
                className="w-full p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-left hover:border-gray-300 dark:hover:border-gray-700 transition-all"
              >
                <div className="flex items-start gap-3">
                  {/* Session Type Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${typeInfo.color}`}>
                    {typeInfo.icon}
                  </div>

                  {/* Session Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
                        {dayName}
                      </span>
                      {hasStrength && (
                        <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                          +Strength
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white mt-0.5">
                      {session.title || (session.session_type === 'rest' ? 'Rest Day' : 'Session')}
                    </p>
                    {session.duration_minutes && session.session_type !== 'rest' && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {session.duration_minutes} min
                      </p>
                    )}
                    {session.cue && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-1 line-clamp-2">
                        &quot;{session.cue}&quot;
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  <svg
                    className="w-5 h-5 text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            )
          })}

          {(!currentWeek || !currentWeek.days || Object.keys(currentWeek.days).length === 0) && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No sessions for this week
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 space-y-3">
          {!athlete.telegram_chat_id && (
            <a
              href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}?start=${athlete.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 bg-[#0088cc] text-white rounded-full font-medium hover:bg-[#0077b5] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              Connect Telegram
            </a>
          )}

          <button
            disabled
            className="w-full py-4 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 rounded-full font-medium cursor-not-allowed"
          >
            Generate Next Prompt (Coming Soon)
          </button>
        </div>
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
          onClick={() => setSelectedSession(null)}
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-t-2xl max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {selectedSession.day}
                </p>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedSession.session.title || 'Session Details'}
                </h2>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Session Type & Duration */}
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                  sessionTypeIcons[selectedSession.session.session_type]?.color || sessionTypeIcons.cross.color
                }`}>
                  {sessionTypeIcons[selectedSession.session.session_type]?.icon || '⚡'}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">
                    {selectedSession.session.session_type}
                  </p>
                  {selectedSession.session.duration_minutes && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedSession.session.duration_minutes} minutes
                    </p>
                  )}
                </div>
              </div>

              {/* Cue */}
              {selectedSession.session.cue && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Focus Cue
                  </p>
                  <p className="text-gray-900 dark:text-white italic">
                    &quot;{selectedSession.session.cue}&quot;
                  </p>
                </div>
              )}

              {/* Structure */}
              {selectedSession.session.structure && selectedSession.session.structure.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Session Structure
                  </h3>
                  <div className="space-y-2">
                    {selectedSession.session.structure.map((block, index) => (
                      <div
                        key={index}
                        className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {block.type}
                          </span>
                          {block.minutes && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {block.minutes} min
                            </span>
                          )}
                        </div>
                        {block.reps && block.rep_duration && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {block.reps}x {block.rep_duration}
                            {block.intensity && ` @ ${block.intensity}`}
                          </p>
                        )}
                        {block.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {block.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strength */}
              {selectedSession.session.strength?.timing && selectedSession.session.strength.timing !== 'none' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Strength Work ({selectedSession.session.strength.timing})
                  </h3>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
                    {selectedSession.session.strength.duration_minutes && (
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        {selectedSession.session.strength.duration_minutes} minutes
                      </p>
                    )}
                    {selectedSession.session.strength.focus && (
                      <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                        Focus: {selectedSession.session.strength.focus}
                      </p>
                    )}
                    {selectedSession.session.strength.exercises && selectedSession.session.strength.exercises.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {selectedSession.session.strength.exercises.map((exercise, index) => (
                          <li key={index} className="text-sm text-purple-700 dark:text-purple-300">
                            • {exercise}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {/* Rest day message */}
              {selectedSession.session.session_type === 'rest' && (
                <div className="p-6 text-center">
                  <p className="text-2xl mb-2">😴</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Rest and recover. Your body adapts while you rest.
                  </p>
                </div>
              )}

              {/* Got it button */}
              <button
                onClick={() => setSelectedSession(null)}
                className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
