import { createServerClient } from '@/lib/supabase'
import { ReengageClient } from './ReengageClient'
import { MotivationMetadata } from '@/app/onboard/page'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ athleteId: string }>
}

export default async function ReengagePage({ params }: PageProps) {
  const { athleteId } = await params
  const supabase = createServerClient()

  // Fetch athlete
  const { data: athlete, error } = await supabase
    .from('athletes')
    .select('motivation_metadata')
    .eq('id', athleteId)
    .single()

  if (error || !athlete) {
    notFound()
  }

  const currentMetadata = (athlete.motivation_metadata as unknown as MotivationMetadata) || {
    whyTrain: null,
    whoLookFor: null,
    nightBefore: null,
    finishLine: null,
  }

  return <ReengageClient athleteId={athleteId} currentMetadata={currentMetadata} />
}
