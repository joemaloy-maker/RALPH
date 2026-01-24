'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SyncClientProps {
  athleteId: string
}

export function SyncClient({ athleteId }: SyncClientProps) {
  const router = useRouter()
  const [planText, setPlanText] = useState('')
  const [showPrompt, setShowPrompt] = useState(false)
  const [copied, setCopied] = useState(false)
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!planText.trim()) return

    setGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId, planText }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate sync prompt')
      }

      const { prompt } = await response.json()
      setGeneratedPrompt(prompt)
      setShowPrompt(true)
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to generate sync prompt. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(generatedPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePasteBack = () => {
    sessionStorage.setItem('pendingPlan', '')
    router.push(`/validate/${athleteId}`)
  }

  // Show the prompt display after generating
  if (showPrompt) {
    return (
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => setShowPrompt(false)}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          ← Edit plan text
        </button>

        {/* Prompt display */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Your Sync Prompt
            </h2>
            <button
              onClick={copyPrompt}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                copied
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
              }`}
            >
              {copied ? 'Copied!' : 'Copy Prompt'}
            </button>
          </div>

          <pre className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap max-h-96 overflow-y-auto">
            {generatedPrompt}
          </pre>
        </div>

        {/* AI Links */}
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Open your preferred AI and paste the prompt:
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://chat.openai.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              ChatGPT
            </a>
            <a
              href="https://claude.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Claude
            </a>
            <a
              href="https://gemini.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Gemini
            </a>
          </div>
        </div>

        {/* Paste back section */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Got your plan?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Copy the JSON response from the AI and paste it on the next page.
            </p>
          </div>
          <button
            onClick={handlePasteBack}
            className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Paste AI Response
          </button>
        </div>

        {/* Manual entry fallback */}
        <div className="pt-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Having trouble with the AI response?
          </p>
          <Link
            href={`/manual-entry/${athleteId}`}
            className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white underline transition-colors"
          >
            Enter sessions manually instead
          </Link>
        </div>
      </div>
    )
  }

  // Initial state - paste plan
  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
          Paste your plan below
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          This can be:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-blue-700 dark:text-blue-300">
          <li>• Text from a coach&apos;s email</li>
          <li>• A copy from TrainingPeaks</li>
          <li>• Your own written plan</li>
          <li>• PT exercises from your physio</li>
        </ul>
        <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
          We&apos;ll format it to work with Joe.
        </p>
      </div>

      {/* Textarea */}
      <div>
        <textarea
          value={planText}
          onChange={(e) => setPlanText(e.target.value)}
          placeholder="Paste your existing training plan here...

Example:
Week 1:
Monday - Easy run 30 min
Tuesday - Rest
Wednesday - Intervals 6x400m
..."
          className="w-full h-64 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white resize-none font-mono text-sm"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!planText.trim() || generating}
        className={`w-full py-4 rounded-full font-medium transition-all ${
          planText.trim() && !generating
            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
        }`}
      >
        {generating ? 'Generating...' : 'Generate Sync Prompt'}
      </button>

      {/* Links */}
      <div className="flex justify-between text-sm">
        <Link
          href={`/prompt/${athleteId}`}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          ← Generate new plan instead
        </Link>
        <Link
          href={`/manual-entry/${athleteId}`}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Enter manually →
        </Link>
      </div>
    </div>
  )
}
