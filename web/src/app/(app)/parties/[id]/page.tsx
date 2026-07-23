'use client'

import { use } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { PartyDetailView } from '@/components/parties/PartyDetailView'

type Props = {
  params: Promise<{ id: string }>
}

export default function PartyDetailPage({ params }: Props) {
  const { id } = use(params)
  const { user } = useAuth()
  if (!user) return null

  return <PartyDetailView partyId={id} role={user.role} />
}
