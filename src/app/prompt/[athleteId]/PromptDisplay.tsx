'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PromptDisplayProps {
  prompt: string
  athleteId: string
}

export function PromptDisplay({ prompt, athleteId }: PromptDisplayProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [planText, setPlanText] = useState('')

  const promptLength = prompt.length
  const isPromptTooLong = promptLength > 8000

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error('Failed to copy')
    }
  }

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const openChatGPT = () => {
    if (isPromptTooLong) {
      copyToClipboard()
      showToast('Prompt copied! Paste it in ChatGPT.')
      window.open('https://chat.openai.com', '_blank')
    } else {
      const encodedPrompt = encodeURIComponent(prompt)
      window.open(`https://chat.openai.com/?q=${encodedPrompt}`, '_blank')
    }
  }

  const openClaude = async () => {
    await navigator.clipboard.writeText(prompt)
    showToast('Prompt copied! Paste it in Claude.')
    window.open('https://claude.ai', '_blank')
  }

  const openGemini = async () => {
    await navigator.clipboard.writeText(prompt)
    showToast('Prompt copied! Paste it in Gemini.')
    window.open('https://gemini.google.com', '_blank')
  }

  const handleSubmitPlan = () => {
    if (!planText.trim()) return
    // Store plan in sessionStorage and redirect to validate
    sessionStorage.setItem('pendingPlan', planText)
    router.push(`/validate/${athleteId}`)
  }

  return (
    <div className="space-y-8">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-3 rounded-lg shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* Prompt display */}
      <div className="relative">
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={copyToClipboard}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
              copied
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 pr-20 font-mono text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
          {prompt}
        </pre>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {promptLength.toLocaleString()} characters
          {isPromptTooLong && (
            <span className="text-amber-600 dark:text-amber-400 ml-2">
              (exceeds ChatGPT URL limit - will copy instead)
            </span>
          )}
        </div>
      </div>

      {/* AI deep links */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Open in AI
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={openChatGPT}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-[#10a37f] hover:bg-[#0d8c6d] text-white font-medium rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.0993 3.8558L12.6 8.3829l2.02-1.1638a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
            </svg>
            ChatGPT
          </button>
          <button
            onClick={openClaude}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-[#d97706] hover:bg-[#b45309] text-white font-medium rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
            Claude
          </button>
          <button
            onClick={openGemini}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-[#4285f4] hover:bg-[#3367d6] text-white font-medium rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            Gemini
          </button>
        </div>
      </div>

      {/* Plan paste-back */}
      <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          When you have your plan, paste it here:
        </h2>
        <textarea
          value={planText}
          onChange={(e) => setPlanText(e.target.value)}
          placeholder="Paste the JSON plan from the AI here..."
          rows={8}
          className="w-full p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white resize-none"
        />
        <button
          onClick={handleSubmitPlan}
          disabled={!planText.trim()}
          className={`w-full py-4 rounded-full font-medium transition-all ${
            planText.trim()
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
          }`}
        >
          Submit Plan
        </button>
      </div>
    </div>
  )
}
