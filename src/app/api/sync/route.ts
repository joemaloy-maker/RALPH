import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { buildSyncPrompt } from '@/lib/prompt-builder'
import type { OnboardingAnswers, MotivationMetadata } from '@/app/onboard/page'

export async function POST(request: NextRequest) {
  try {
    const { athleteId, planText } = await request.json()

    if (!athleteId || !planText) {
      return NextResponse.json(
        { error: 'Missing athleteId or planText' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Fetch athlete data
    const { data: athlete, error } = await supabase
      .from('athletes')
      .select('*')
      .eq('id', athleteId)
      .single()

    if (error || !athlete) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      )
    }

    const answers = athlete.onboarding_answers as unknown as OnboardingAnswers
    const metadata = athlete.motivation_metadata as unknown as MotivationMetadata

    // Build the sync prompt
    const prompt = buildSyncPrompt(answers, metadata, planText)

    return NextResponse.json({ prompt })
  } catch (err) {
    console.error('Error generating sync prompt:', err)
    return NextResponse.json(
      { error: 'Failed to generate sync prompt' },
      { status: 500 }
    )
  }
}
