import { ValidateClient } from './ValidateClient'

interface ValidatePageProps {
  params: Promise<{
    athleteId: string
  }>
}

export default async function ValidatePage({ params }: ValidatePageProps) {
  const { athleteId } = await params

  return <ValidateClient athleteId={athleteId} />
}
