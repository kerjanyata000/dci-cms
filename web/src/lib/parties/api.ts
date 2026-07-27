import { cmsFetch } from '@/lib/api/http'
import type { PartyListItem } from '@/lib/parties/list'
import type {
  Contract,
  ContractAmendment,
  ContractTermination,
  CounterpartyChange,
  DocumentRow,
  OdooLinkStatus,
  Party,
  SoHealth,
} from '@/types/cms'

export type { PartyListItem } from '@/lib/parties/list'

export type ListPartiesParams = {
  q?: string
  linkStatus?: OdooLinkStatus | 'all'
  pic?: string
  contractStatus?: string
}

async function parseJson<T>(res: Response): Promise<T> {
  const payload = (await res.json()) as { ok?: boolean; data?: T; error?: string }
  if (!res.ok || !payload.ok) {
    throw new Error(payload.error ?? `Request failed (${res.status})`)
  }
  return payload.data as T
}

export async function fetchParties(params: ListPartiesParams = {}): Promise<PartyListItem[]> {
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.pic) search.set('pic', params.pic)
  if (params.contractStatus && params.contractStatus !== 'all') {
    search.set('contractStatus', params.contractStatus)
  }
  if (params.linkStatus && params.linkStatus !== 'all') {
    search.set('linkStatus', params.linkStatus)
  }
  const qs = search.toString()
  const data = await parseJson<{ parties: PartyListItem[] }>(
    await cmsFetch(`/api/parties${qs ? `?${qs}` : ''}`),
  )
  return data.parties
}

export type PartyDetailPayload = {
  party: Party
  contracts: Contract[]
  documents: DocumentRow[]
  amendments: ContractAmendment[]
  terminations: ContractTermination[]
  counterpartyChanges: CounterpartyChange[]
  auditLogs: Array<{
    id: string
    action: string
    action_type: string | null
    actor_name: string | null
    created_at: string
    payload: Record<string, unknown>
  }>
  soHealth: SoHealth
}

export async function fetchPartyDetail(id: string): Promise<PartyDetailPayload> {
  return parseJson<PartyDetailPayload>(await cmsFetch(`/api/parties/${id}`))
}

export async function createParty(input: {
  name: string
  pic?: string
  npwp?: string
  address?: string
  party_type?: string
  contact_email?: string
  contact_phone?: string
}): Promise<Party> {
  const data = await parseJson<{ party: Party }>(
    await cmsFetch('/api/parties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  )
  return data.party
}

export async function updateParty(
  partyId: string,
  input: {
    name?: string
    pic?: string | null
    npwp?: string | null
    address?: string | null
    party_type?: string | null
    contact_email?: string | null
    contact_phone?: string | null
  },
): Promise<Party> {
  const data = await parseJson<{ party: Party }>(
    await cmsFetch(`/api/parties/${partyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', ...input }),
    }),
  )
  return data.party
}

export async function setPartyActive(partyId: string, active: boolean): Promise<Party> {
  const data = await parseJson<{ party: Party }>(
    await cmsFetch(`/api/parties/${partyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: active ? 'activate' : 'deactivate' }),
    }),
  )
  return data.party
}

export async function voidPartyDocument(
  partyId: string,
  documentId: string,
  reason?: string,
): Promise<DocumentRow> {
  const data = await parseJson<{ document: DocumentRow }>(
    await cmsFetch(`/api/parties/${partyId}/documents`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'void', documentId, reason }),
    }),
  )
  return data.document
}

export async function linkPartyOdoo(
  partyId: string,
  input: { odooPartnerId: number; reason?: string },
): Promise<Party> {
  const data = await parseJson<{ party: Party }>(
    await cmsFetch(`/api/parties/${partyId}/link-odoo`, {
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
    await cmsFetch(`/api/parties/${partyId}/link-odoo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ odooPartnerId, preview: true }),
    }),
  )
}
