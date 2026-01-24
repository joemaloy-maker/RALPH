'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface ManualEntryClientProps {
  athleteId: string
}

interface SessionEntry {
  id: string
  date: string
  session_type: string
  title: string
  duration_minutes: number
  description: string
  cue: string
}

const sessionTypes = ['run', 'bike', 'swim', 'brick', 'strength', 'rest', 'cross']

const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export function ManualEntryClient({ athleteId }: ManualEntryClientProps) {
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionEntry[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state for adding a session
  const [newSession, setNewSession] = useState<Omit<SessionEntry, 'id'>>({
    date: '',
    session_type: 'run',
    title: '',
    duration_minutes: 30,
    description: '',
    cue: '',
  })

  const addSession = () => {
    if (!newSession.date || !newSession.title) return

    setSessions([
      ...sessions,
      {
        ...newSession,
        id: crypto.randomUUID(),
      },
    ])

    // Reset form but keep date nearby
    const nextDate = new Date(newSession.date)
    nextDate.setDate(nextDate.getDate() + 1)
    setNewSession({
      date: nextDate.toISOString().split('T')[0],
      session_type: 'run',
      title: '',
      duration_minutes: 30,
      description: '',
      cue: '',
    })
  }

  const removeSession = (id: string) => {
    setSessions(sessions.filter(s => s.id !== id))
  }

  const savePlan = async () => {
    if (sessions.length === 0) {
      setError('Add at least one session before saving')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Group sessions by week
      const sessionsByDate = sessions.sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )

      // Find the start of the first week (Monday)
      const firstDate = new Date(sessionsByDate[0].date)
      const dayOfWeek = firstDate.getDay()
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const weekStart = new Date(firstDate)
      weekStart.setDate(firstDate.getDate() + mondayOffset)

      // Build weeks structure
      const weeks: Array<{
        week_number: number
        days: Record<string, {
          session_type: string
          title: string
          duration_minutes: number
          cue: string
          structure: Array<{
            segment: string
            minutes: number
            description: string
          }>
        }>
      }> = []

      for (const session of sessionsByDate) {
        const sessionDate = new Date(session.date)
        const weekNumber = Math.floor(
          (sessionDate.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
        ) + 1

        // Find or create week
        let week = weeks.find(w => w.week_number === weekNumber)
        if (!week) {
          week = { week_number: weekNumber, days: {} }
          weeks.push(week)
        }

        // Get day name
        const dayIndex = sessionDate.getDay()
        const dayName = dayNames[dayIndex === 0 ? 6 : dayIndex - 1]

        // Add session to day
        week.days[dayName] = {
          session_type: session.session_type,
          title: session.title,
          duration_minutes: session.duration_minutes,
          cue: session.cue || '',
          structure: session.description ? [{
            segment: 'main',
            minutes: session.duration_minutes,
            description: session.description,
          }] : [],
        }
      }

      // Sort weeks by number
      weeks.sort((a, b) => a.week_number - b.week_number)

      // Re-number weeks starting from 1
      weeks.forEach((w, i) => {
        w.week_number = i + 1
      })

      // Save to database
      const { error: insertError } = await supabase
        .from('plans')
        .insert({
          athlete_id: athleteId,
          version: 1,
          macro_plan: null,
          weeks: weeks,
        })

      if (insertError) {
        throw insertError
      }

      router.push(`/plan/${athleteId}`)
    } catch (err) {
      console.error('Error saving plan:', err)
      setError('Failed to save plan. Please try again.')
      setSaving(false)
    }
  }

  // Sort sessions by date for display
  const sortedSessions = [...sessions].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  return (
    <div className="space-y-8">
      {/* Add Session Form */}
      <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Add a Session
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <input
              type="date"
              value={newSession.date}
              onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
              className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Session Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              value={newSession.session_type}
              onChange={(e) => setNewSession({ ...newSession, session_type: e.target.value })}
              className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            >
              {sessionTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title
          </label>
          <input
            type="text"
            value={newSession.title}
            onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
            placeholder="e.g., Easy Run, Tempo Intervals"
            className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Duration (minutes)
          </label>
          <input
            type="number"
            value={newSession.duration_minutes}
            onChange={(e) => setNewSession({ ...newSession, duration_minutes: parseInt(e.target.value) || 0 })}
            min={0}
            className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description (optional)
          </label>
          <textarea
            value={newSession.description}
            onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
            placeholder="Details about the workout..."
            rows={2}
            className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white resize-none"
          />
        </div>

        {/* Cue */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Cue (optional, max 15 words)
          </label>
          <input
            type="text"
            value={newSession.cue}
            onChange={(e) => setNewSession({ ...newSession, cue: e.target.value })}
            placeholder="e.g., Stay relaxed, find your rhythm"
            className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
          />
        </div>

        {/* Add button */}
        <button
          onClick={addSession}
          disabled={!newSession.date || !newSession.title}
          className={`w-full py-3 rounded-lg font-medium transition-all ${
            newSession.date && newSession.title
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          Add Session
        </button>
      </div>

      {/* Sessions Preview */}
      {sortedSessions.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Your Sessions ({sortedSessions.length})
          </h3>

          <div className="space-y-2">
            {sortedSessions.map(session => (
              <div
                key={session.id}
                className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(session.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full capitalize">
                      {session.session_type}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">
                    {session.title}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {session.duration_minutes} min
                  </p>
                  {session.cue && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-1">
                      &quot;{session.cue}&quot;
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeSession(session.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Save button */}
      <button
        onClick={savePlan}
        disabled={sessions.length === 0 || saving}
        className={`w-full py-4 rounded-full font-medium transition-all ${
          sessions.length > 0 && !saving
            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
        }`}
      >
        {saving ? 'Saving...' : `Save Plan (${sessions.length} sessions)`}
      </button>

      {/* Navigation */}
      <div className="flex justify-center">
        <Link
          href={`/sync/${athleteId}`}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          ← Try syncing an existing plan instead
        </Link>
      </div>
    </div>
  )
}
