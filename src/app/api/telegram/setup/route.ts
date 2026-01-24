import { NextRequest, NextResponse } from 'next/server'
import { setWebhook, deleteWebhook, getWebhookInfo } from '@/lib/telegram'

// GET handler to set up or check the webhook
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'set'

  try {
    switch (action) {
      case 'set': {
        // Get the app URL from environment or request
        const appUrl = process.env.NEXT_PUBLIC_APP_URL
        if (!appUrl) {
          return NextResponse.json(
            { error: 'NEXT_PUBLIC_APP_URL is not configured' },
            { status: 500 }
          )
        }

        const webhookUrl = `${appUrl}/api/telegram/webhook`
        const result = await setWebhook(webhookUrl)

        return NextResponse.json({
          success: true,
          message: 'Webhook set successfully',
          webhookUrl: result.webhookUrl,
        })
      }

      case 'delete': {
        await deleteWebhook()
        return NextResponse.json({
          success: true,
          message: 'Webhook deleted successfully',
        })
      }

      case 'info': {
        const info = await getWebhookInfo()
        return NextResponse.json({
          success: true,
          webhookInfo: info,
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: set, delete, or info' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in Telegram setup:', error)
    return NextResponse.json(
      {
        error: 'Failed to configure webhook',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
