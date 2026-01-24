import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import { PlanClient } from './PlanClient'

interface PlanPageProps {
  params: Promise<{
    athleteId: string
  }>
}

export default async function PlanPage({ params }: PlanPageProps) {
  const { athleteId } = await params
  const supabase = createServerClient()

  // Fetch athlete and latest plan in parallel
  const [athleteResult, planResult] = await Promise.all([
    supabase
      .from('athletes')
      .select('*')
      .eq('id', athleteId)
      .single(),
    supabase
      .from('plans')
      .select('*')
      .eq('athlete_id', athleteId)
      .order('version', { ascending: false })
      .limit(1)
      .single()
  ])

  const athlete = athleteResult.data
  const plan = planResult.data

  // No athlete found
  if (!athlete) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col items-center justify-center p-8">
        <div className="max-w-md text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Athlete not found
          </h1>

          <p className="text-gray-600 dark:text-gray-400">
            We couldn&apos;t find an athlete with this ID.
          </p>

          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    )
  }

  // No plan found
  if (!plan) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col items-center justify-center p-8">
        <div className="max-w-md text-center space-y-6">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-amber-600 dark:text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            No plan yet
          </h1>

          <p className="text-gray-600 dark:text-gray-400">
            Generate a prompt and save a plan to see it here.
          </p>

          <Link
            href={`/prompt/${athleteId}`}
            className="inline-block px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Go to prompt
          </Link>
        </div>
      </div>
    )
  }

  return <PlanClient athlete={athlete} plan={plan} />
}
