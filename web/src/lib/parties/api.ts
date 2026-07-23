import type { OdooLinkStatus, Party } from '@/types/cms'

async function parseJson<T>(res: Response): Promise<T> {
  const payload = (await res.json()) as { ok?: boolean; data?: T; error?: string }
  if (!res.ok || !payload.ok) {
    throw new Error(payload.error ?? `Request failed (${res.status})`)
  }
  return payload.data as T
}

export type ListPartiesParams = {
  q?: string
  linkStatus?: OdooLinkStatus | 'all'
}

export async function fetchParties(params: ListPartiesParams = {}): Promise<Party[]> {
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.linkStatus && params.linkStatus !== 'all') {
    search.set('linkStatus', params.linkStatus)
  }
  const qs = search.toString()
  const data = await parseJson<{ parties: Party[] }>(await fetch(`/api/parties${qs ? `?${qs}` : ''}`))
  return data.parties
}

export async function createParty(input: { name: string; pic?: string }): Promise<Party> {
  const data = await parseJson<{ party: Party }>(
    await fetch('/api/parties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  )
  return data.party
}

export async function linkPartyOdoo(
  partyId: string,
  input: { odooPartnerId: number; reason?: string },
): Promise<Party> {
  const data = await parseJson<{ party: Party }>(
    await fetch(`/api/parties/${partyId}/link-odoo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  )
  return data.party
}

export type LinkOdooPreview = {
  party: Party
  partner: import('@/lib/odoo/types').OdooPartner
  suggestedStatus: OdooLinkStatus
  comparison: import('@/lib/parties/odoo-link').OdooLinkComparison[]
}

export async function previewPartyOdooLink(
  partyId: string,
  odooPartnerId: number,
): Promise<LinkOdooPreview> {
  return parseJson<LinkOdooPreview>(
    await fetch(`/api/parties/${partyId}/link-odoo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ odooPartnerId, preview: true }),
    }),
  )
}
