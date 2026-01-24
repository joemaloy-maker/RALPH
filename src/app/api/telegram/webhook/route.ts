import { NextRequest, NextResponse } from 'next/server'
import { bot } from '@/lib/telegram'
import { createServerClient } from '@/lib/supabase'
import type { Athlete } from '@/types/database'
import {
  parseCallbackData,
  handleStatusCallback,
  handleRpeCallback,
  handleSkipCallback,
  handleNotesMessage,
  getConversationState,
} from '@/lib/feedback-handler'

// Register bot command handlers
if (bot) {
  // Handle /start command with athlete ID parameter
  // URL format: https://t.me/BOT_USERNAME?start={athleteId}
  // When user taps Start, we receive: /start {athleteId}
  bot.command('start', async (ctx) => {
    const startParam = ctx.match // This is the payload after /start
    const chatId = ctx.chat.id.toString()

    if (!startParam) {
      // No athlete ID provided - generic welcome
      await ctx.reply(
        "Welcome to Joe! To connect your account, please use the link from your Joe profile.",
        { parse_mode: 'HTML' }
      )
      return
    }

    const athleteId = startParam.trim()

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(athleteId)) {
      await ctx.reply(
        "Invalid connection link. Please use the link from your Joe profile.",
        { parse_mode: 'HTML' }
      )
      return
    }

    // Look up athlete and save telegram_chat_id
    const supabase = createServerClient()

    try {
      // Check if athlete exists
      const { data, error: fetchError } = await supabase
        .from('athletes')
        .select('*')
        .eq('id', athleteId)
        .single()

      if (fetchError || !data) {
        await ctx.reply(
          "We couldn't find your account. Please make sure you're using the correct link from Joe.",
          { parse_mode: 'HTML' }
        )
        return
      }

      const athlete = data as Athlete

      // Check if already connected
      if (athlete.telegram_chat_id === chatId) {
        await ctx.reply(
          "You're already connected! I'll send your training sessions here each morning.",
          { parse_mode: 'HTML' }
        )
        return
      }

      // Update the athlete's telegram_chat_id
      const { error: updateError } = await supabase
        .from('athletes')
        .update({ telegram_chat_id: chatId })
        .eq('id', athleteId)

      if (updateError) {
        console.error('Error updating telegram_chat_id:', updateError)
        await ctx.reply(
          "Something went wrong connecting your account. Please try again.",
          { parse_mode: 'HTML' }
        )
        return
      }

      // Send welcome message
      await ctx.reply(
        `You're connected! 🎯

I'll send your training sessions here each morning.

After each session, I'll check in to see how it went.`,
        { parse_mode: 'HTML' }
      )

    } catch (error) {
      console.error('Error in /start handler:', error)
      await ctx.reply(
        "Something went wrong. Please try again later.",
        { parse_mode: 'HTML' }
      )
    }
  })

  // Handle /help command
  bot.command('help', async (ctx) => {
    await ctx.reply(
      `<b>Joe Commands</b>

/start - Connect your Joe account
/help - Show this help message
/status - Check your connection status

I'll send your daily sessions each morning and check in after each workout.`,
      { parse_mode: 'HTML' }
    )
  })

  // Handle /status command
  bot.command('status', async (ctx) => {
    const chatId = ctx.chat.id.toString()
    const supabase = createServerClient()

    try {
      const { data: athlete, error } = await supabase
        .from('athletes')
        .select('id')
        .eq('telegram_chat_id', chatId)
        .single()

      if (error || !athlete) {
        await ctx.reply(
          "You're not connected to a Joe account yet. Use the link from your Joe profile to connect.",
          { parse_mode: 'HTML' }
        )
        return
      }

      await ctx.reply(
        "You're connected and ready to receive sessions! 🎯",
        { parse_mode: 'HTML' }
      )
    } catch (error) {
      console.error('Error in /status handler:', error)
      await ctx.reply(
        "Something went wrong checking your status. Please try again.",
        { parse_mode: 'HTML' }
      )
    }
  })

  // Handle text messages (for notes capture)
  bot.on('message:text', async (ctx) => {
    const chatId = ctx.chat.id.toString()
    const text = ctx.message.text

    // Check if it's a command
    if (text.startsWith('/')) {
      return // Let command handlers deal with it
    }

    // Check if we're awaiting notes
    const state = getConversationState(chatId)
    if (state && state.visibleAwaitingNotes) {
      try {
        await handleNotesMessage(chatId, state.visibleSessionId, text)
      } catch (error) {
        console.error('Error handling notes:', error)
        await ctx.reply(
          "Something went wrong saving your notes. Please try again.",
          { parse_mode: 'HTML' }
        )
      }
      return
    }

    // Default response for unrecognized messages
    await ctx.reply(
      `I didn't understand that. Try /help to see what I can do.`,
      { parse_mode: 'HTML' }
    )
  })

  // Handle callback queries (button presses)
  bot.on('callback_query:data', async (ctx) => {
    // Acknowledge the callback to remove loading state
    await ctx.answerCallbackQuery()

    const chatId = ctx.chat?.id.toString()
    if (!chatId) return

    const data = ctx.callbackQuery.data
    console.log('Received callback query:', data)

    // Parse callback data
    const parsed = parseCallbackData(data)
    if (!parsed) {
      console.error('Invalid callback data:', data)
      return
    }

    const { type, sessionId, value } = parsed

    try {
      switch (type) {
        case 'status':
          await handleStatusCallback(chatId, sessionId, value)
          break

        case 'rpe':
          await handleRpeCallback(chatId, sessionId, value)
          break

        case 'skip':
          await handleSkipCallback(chatId, sessionId, value)
          break

        case 'log':
          // "Log session" button from daily delivery - send check-in
          const { sendSessionCheckIn } = await import('@/lib/feedback-handler')
          await sendSessionCheckIn(chatId, sessionId)
          break

        default:
          console.log('Unknown callback type:', type)
      }
    } catch (error) {
      console.error('Error handling callback:', error)
      await ctx.reply(
        "Something went wrong. Please try again.",
        { parse_mode: 'HTML' }
      )
    }
  })
}

// POST handler for webhook
export async function POST(request: NextRequest) {
  if (!bot) {
    return NextResponse.json(
      { error: 'Telegram bot is not configured' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()

    // Process the update
    await bot.handleUpdate(body)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error processing Telegram webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

// GET handler for webhook verification (Telegram sometimes pings this)
export async function GET() {
  return NextResponse.json({ status: 'Telegram webhook endpoint is active' })
}
