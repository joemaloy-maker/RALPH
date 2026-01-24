import { NextRequest, NextResponse } from 'next/server'
import { bot, initBot } from '@/lib/telegram'
import { createServerClient } from '@/lib/supabase'
import type { Athlete } from '@/types/database'

if (bot) {
  bot.command('start', async (ctx) => {
    const startParam = ctx.match
    const chatId = ctx.chat.id.toString()

    if (!startParam) {
      await ctx.reply("Welcome to Joe! To connect your account, please use the link from your Joe profile.", { parse_mode: 'HTML' })
      return
    }

    const athleteId = startParam.trim()
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(athleteId)) {
      await ctx.reply("Invalid connection link. Please use the link from your Joe profile.", { parse_mode: 'HTML' })
      return
    }

    const supabase = createServerClient()

    try {
      const { data, error: fetchError } = await supabase
        .from('athletes')
        .select('*')
        .eq('id', athleteId)
        .single()

      if (fetchError || !data) {
        await ctx.reply("We couldn't find your account. Please make sure you're using the correct link from Joe.", { parse_mode: 'HTML' })
        return
      }

      const athlete = data as Athlete

      if (athlete.telegram_chat_id === chatId) {
        await ctx.reply("You're already connected! I'll send your training sessions here each morning.", { parse_mode: 'HTML' })
        return
      }

      const { error: updateError } = await supabase
        .from('athletes')
        .update({ telegram_chat_id: chatId })
        .eq('id', athleteId)

      if (updateError) {
        console.error('Error updating telegram_chat_id:', updateError)
        await ctx.reply("Something went wrong connecting your account. Please try again.", { parse_mode: 'HTML' })
        return
      }

      await ctx.reply(`You're connected! 🎯

I'll send your training sessions here each morning.

After each session, I'll check in to see how it went.`, { parse_mode: 'HTML' })
    } catch (error) {
      console.error('Error in /start handler:', error)
      await ctx.reply("Something went wrong. Please try again later.", { parse_mode: 'HTML' })
    }
  })

  bot.command('help', async (ctx) => {
    await ctx.reply(`<b>Joe Commands</b>

/start - Connect your Joe account
/help - Show this help message
/status - Check your connection status

I'll send your daily sessions each morning and check in after each workout.`, { parse_mode: 'HTML' })
  })

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
        await ctx.reply("You're not connected to a Joe account yet. Use the link from your Joe profile to connect.", { parse_mode: 'HTML' })
        return
      }

      await ctx.reply("You're connected and ready to receive sessions! 🎯", { parse_mode: 'HTML' })
    } catch (error) {
      console.error('Error in /status handler:', error)
      await ctx.reply("Something went wrong checking your status. Please try again.", { parse_mode: 'HTML' })
    }
  })

  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text
    if (text.startsWith('/')) return
    await ctx.reply("I didn't understand that. Try /help to see what I can do.", { parse_mode: 'HTML' })
  })

  bot.on('callback_query:data', async (ctx) => {
    await ctx.answerCallbackQuery()
    console.log('Received callback query:', ctx.callbackQuery.data)
  })
}

export async function POST(request: NextRequest) {
  if (!bot) {
    return NextResponse.json({ error: 'Telegram bot is not configured' }, { status: 500 })
  }

  try {
    await initBot()
    const body = await request.json()
    await bot.handleUpdate(body)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error processing Telegram webhook:', error)
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Telegram webhook endpoint is active' })
}