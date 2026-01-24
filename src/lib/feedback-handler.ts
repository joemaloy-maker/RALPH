import { createServerClient } from '@/lib/supabase'
import { sendMessage, sendMessageWithButtons } from '@/lib/telegram'

/**
 * Conversation state tracking
 * In production, consider using Redis or database for persistence
 */
interface ConversationState {
visibleSessionId: string
  visibleAwaitingNotes: boolean
  timestamp: number
}

// In-memory store for conversation state (use Redis in production)
const conversationStates = new Map<string, ConversationState>()

// Clean up old states after 1 hour
const STATE_EXPIRY_MS = 60 * 60 * 1000

function cleanupOldStates() {
  const now = Date.now()
  const entries = Array.from(conversationStates.entries())
  for (const [chatId, state] of entries) {
    if (now - state.timestamp > STATE_EXPIRY_MS) {
      conversationStates.delete(chatId)
    }
  }
}

/**
 * Set conversation state for a chat
 */
export function setConversationState(chatId: string, sessionId: string, awaitingNotes: boolean) {
  cleanupOldStates()
  conversationStates.set(chatId, {
    visibleSessionId: sessionId,
    visibleAwaitingNotes: awaitingNotes,
    timestamp: Date.now(),
  })
}

/**
 * Get conversation state for a chat
 */
export function getConversationState(chatId: string): ConversationState | null {
  cleanupOldStates()
  return conversationStates.get(chatId) || null
}

/**
 * Clear conversation state for a chat
 */
export function clearConversationState(chatId: string) {
  conversationStates.delete(chatId)
}

/**
 * Send the initial check-in message after session delivery
 */
export async function sendSessionCheckIn(chatId: string, sessionId: string) {
  const result = await sendMessageWithButtons(
    chatId,
    "How'd it go?",
    [
      { text: 'Done ✓', callback_data: `status:${sessionId}:completed` },
      { text: 'Modified', callback_data: `status:${sessionId}:modified` },
      { text: 'Skipped', callback_data: `status:${sessionId}:skipped` },
    ]
  )

  return result
}

/**
 * Handle status callback (Done/Modified/Skipped)
 */
export async function handleStatusCallback(
  chatId: string,
  sessionId: string,
  status: string
): Promise<string> {
  const supabase = createServerClient()

  if (status === 'skipped') {
    // Ask for skip reason
    await sendMessageWithButtons(
      chatId,
      "No worries. What got in the way?",
      [
        { text: 'Life happened', callback_data: `skip:${sessionId}:life` },
        { text: 'Too tired', callback_data: `skip:${sessionId}:tired` },
        { text: 'Injured', callback_data: `skip:${sessionId}:injured` },
        { text: "Didn't want to", callback_data: `skip:${sessionId}:didnt_want_to` },
      ]
    )
    return 'awaiting_skip_reason'
  }

  // Update session status
  await supabase
    .from('sessions')
    .update({ status })
    .eq('id', sessionId)

  // Ask for RPE
  await sendMessageWithButtons(
    chatId,
    "How hard was that?",
    [
      { text: '1', callback_data: `rpe:${sessionId}:1` },
      { text: '2-3', callback_data: `rpe:${sessionId}:2-3` },
      { text: '4-5', callback_data: `rpe:${sessionId}:4-5` },
      { text: '6-7', callback_data: `rpe:${sessionId}:6-7` },
      { text: '8-9', callback_data: `rpe:${sessionId}:8-9` },
      { text: '10', callback_data: `rpe:${sessionId}:10` },
    ]
  )

  return 'awaiting_rpe'
}

/**
 * Handle RPE callback
 */
export async function handleRpeCallback(
  chatId: string,
  sessionId: string,
  rpe: string
): Promise<string> {
  const supabase = createServerClient()

  // Update session RPE
  await supabase
    .from('sessions')
    .update({ rpe })
    .eq('id', sessionId)

  // Ask for notes
  await sendMessage(
    chatId,
    "Anything we should know?\n\n<i>(Reply with a message, or just ignore to skip)</i>"
  )

  // Set state to await notes
  setConversationState(chatId, sessionId, true)

  return 'awaiting_notes'
}

/**
 * Handle skip reason callback
 */
export async function handleSkipCallback(
  chatId: string,
  sessionId: string,
  reason: string
): Promise<void> {
  const supabase = createServerClient()

  // Update session with skip status and reason
  await supabase
    .from('sessions')
    .update({
      status: 'skipped',
      skip_reason: reason,
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  // Send confirmation
  await sendMessage(chatId, "No worries. Tomorrow's a new day. 💪")

  // Clear conversation state
  clearConversationState(chatId)
}

/**
 * Handle free text notes
 */
export async function handleNotesMessage(
  chatId: string,
  sessionId: string,
  notes: string
): Promise<void> {
  const supabase = createServerClient()

  // Update session with notes and mark as complete
  await supabase
    .from('sessions')
    .update({
      notes,
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  // Send confirmation
  await sendMessage(chatId, "Logged! 💪")

  // Clear conversation state
  clearConversationState(chatId)
}

/**
 * Complete a session without notes
 */
export async function completeSessionWithoutNotes(
  chatId: string,
  sessionId: string
): Promise<void> {
  const supabase = createServerClient()

  // Mark session as complete
  await supabase
    .from('sessions')
    .update({
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  // Send confirmation
  await sendMessage(chatId, "Logged! 💪")

  // Clear conversation state
  clearConversationState(chatId)
}

/**
 * Parse callback data
 */
export function parseCallbackData(data: string): {
  type: string
  sessionId: string
  value: string
} | null {
  const parts = data.split(':')
  if (parts.length !== 3) return null

  return {
    type: parts[0],
    sessionId: parts[1],
    value: parts[2],
  }
}

/**
 * Create or get a session record for today
 */
export async function getOrCreateTodaySession(
  planId: string,
  sessionType: string,
  prescribed: unknown
): Promise<string> {
  const supabase = createServerClient()
  const today = new Date().toISOString().split('T')[0]

  // Check if session already exists for today
  const { data: existing } = await supabase
    .from('sessions')
    .select('id')
    .eq('plan_id', planId)
    .eq('date', today)
    .single()

  if (existing) {
    return existing.id
  }

  // Create new session
  const { data: newSession, error } = await supabase
    .from('sessions')
    .insert({
      plan_id: planId,
      date: today,
      session_type: sessionType,
      prescribed: prescribed as never,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating session:', error)
    throw error
  }

  return newSession.id
}
