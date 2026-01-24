import { Bot, webhookCallback } from 'grammy'

const token = process.env.TELEGRAM_BOT_TOKEN

if (!token && process.env.NODE_ENV === 'production') {
  console.warn('TELEGRAM_BOT_TOKEN is not set')
}

export const bot = token ? new Bot(token) : null

let botInitialized = false

export async function initBot() {
  if (!bot || botInitialized) return
  try {
    await bot.init()
    botInitialized = true
    console.log('Bot initialized successfully')
  } catch (error) {
    console.error('Error initializing bot:', error)
    throw error
  }
}

const BLOCKED_ERROR_CODES = [403]
const BLOCKED_ERROR_DESCRIPTIONS = ['bot was blocked by the user', 'user is deactivated', 'chat not found']

export function isUserBlockedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as { error_code?: number; description?: string }
  if (err.error_code && BLOCKED_ERROR_CODES.includes(err.error_code)) return true
  if (err.description) {
    return BLOCKED_ERROR_DESCRIPTIONS.some(desc => err.description?.toLowerCase().includes(desc.toLowerCase()))
  }
  return false
}

export async function sendMessage(chatId: string | number, text: string): Promise<{ success: boolean; blocked?: boolean; message?: unknown }> {
  if (!bot) {
    console.error('Telegram bot is not initialized')
    return { success: false }
  }
  try {
    const message = await bot.api.sendMessage(chatId, text, { parse_mode: 'HTML' })
    return { success: true, message }
  } catch (error) {
    if (isUserBlockedError(error)) {
      console.log(`User ${chatId} has blocked the bot`)
      return { success: false, blocked: true }
    }
    console.error('Error sending Telegram message:', error)
    return { success: false }
  }
}

export async function sendMessageWithButtons(
  chatId: string | number,
  text: string,
  buttons: Array<{ text: string; callback_data?: string; url?: string }>
): Promise<{ success: boolean; blocked?: boolean; message?: unknown }> {
  if (!bot) {
    console.error('Telegram bot is not initialized')
    return { success: false }
  }
  try {
    const inlineKeyboard = buttons.map(btn => {
      if (btn.url) return { text: btn.text, url: btn.url }
      return { text: btn.text, callback_data: btn.callback_data || '' }
    })
    const message = await bot.api.sendMessage(chatId, text, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [inlineKeyboard] },
    })
    return { success: true, message }
  } catch (error) {
    if (isUserBlockedError(error)) {
      console.log(`User ${chatId} has blocked the bot`)
      return { success: false, blocked: true }
    }
    console.error('Error sending Telegram message with buttons:', error)
    return { success: false }
  }
}

export function getWebhookHandler() {
  if (!bot) return null
  return webhookCallback(bot, 'std/http')
}

export async function setWebhook(webhookUrl: string) {
  if (!bot) throw new Error('Telegram bot is not initialized')
  await bot.api.setWebhook(webhookUrl)
  return { success: true, webhookUrl }
}

export async function deleteWebhook() {
  if (!bot) throw new Error('Telegram bot is not initialized')
  await bot.api.deleteWebhook()
  return { success: true }
}

export async function getWebhookInfo() {
  if (!bot) throw new Error('Telegram bot is not initialized')
  return await bot.api.getWebhookInfo()
}

export function getTelegramDeepLink(athleteId: string): string {
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'JoeCoachBot'
  return `https://t.me/${botUsername}?start=${athleteId}`
}