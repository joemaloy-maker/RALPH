import { createServerClient } from '@/lib/supabase'
import { ManualEntryClient } from './ManualEntryClient'
import Link from 'next/link'

interface ManualEntryPageProps {
  params: Promise<{
    athleteId: string
  }>
}

export default async function ManualEntryPage({ params }: ManualEntryPageProps) {
  const { athleteId } = await params
  const supabase = createServerClient()

  // Fetch athlete data to verify it exists
  const { data: athlete, error } = await supabase
    .from('athletes')
    .select('id')
    .eq('id', athleteId)
    .single()

  if (error || !athlete) {
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
                d="M6 18L18 6M6 6l12 12"
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
            className="inline-block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/sync/${athleteId}`}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← Back to sync
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">
            Enter sessions manually
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Add your training sessions one by one. This bypasses AI generation.
          </p>
        </div>

        {/* Client component handles the interactive parts */}
        <ManualEntryClient athleteId={athleteId} />
      </div>
    </div>
  )
}
