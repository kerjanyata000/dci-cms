import type { RenewalAgendaItem, RenewalSummary } from '@/lib/renewal/types'

async function parseJson<T>(res: Response): Promise<T> {
  const payload = (await res.json()) as { ok?: boolean; data?: T; error?: string }
  if (!res.ok || !payload.ok) {
    throw new Error(payload.error ?? `Request failed (${res.status})`)
  }
  return payload.data as T
}

export type RenewalPayload = {
  items: RenewalAgendaItem[]
  summary: RenewalSummary
}

export async function fetchRenewalAgenda(): Promise<RenewalPayload> {
  return parseJson<RenewalPayload>(await fetch('/api/renewal'))
}
