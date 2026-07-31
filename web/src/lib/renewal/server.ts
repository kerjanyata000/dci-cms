import 'server-only'

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { PARTY_ON_CONTRACT, PARTY_ON_TERMINATION } from '@/lib/supabase/embeds'
import type { RenewalAgendaItem, RenewalKind } from '@/lib/renewal/types'
import { diffCalendarDays, isoMonth, todayIso } from '@/lib/time'

export type { RenewalAgendaItem, RenewalKind } from '@/lib/renewal/types'

const ACTIVE_STATUSES = ['active', 'fully_signed', 'signed', 'under_review', 'draft']

function unwrapParty(raw: unknown): { party_code: string; name: string; pic: string | null } | null {
  if (!raw) return null
  const row = Array.isArray(raw) ? raw[0] : raw
  if (!row || typeof row !== 'object') return null
  const p = row as { party_code?: string; name?: string; pic?: string | null }
  if (!p.party_code || !p.name) return null
  return { party_code: p.party_code, name: p.name, pic: p.pic ?? null }
}

export function urgencyBucket(daysLeft: number): 'urgent' | 'soon' | 'later' {
  if (daysLeft < 0) return 'later'
  if (daysLeft <= 30) return 'urgent'
  if (daysLeft <= 180) return 'soon'
  return 'later'
}

function formatDuration(months: number | null): string {
  if (!months) return '—'
  return `${months} bln`
}

export async function loadRenewalAgenda(): Promise<RenewalAgendaItem[]> {
  const db = getSupabaseAdmin()
  const today = todayIso()

  const [contractsRes, terminationsRes] = await Promise.all([
    db
      .from('contracts')
      .select(
        `id, party_id, contract_code, contract_title, status, duration_months, renewal_date, expiry_date, ${PARTY_ON_CONTRACT}(party_code, name, pic)`,
      )
      .not('status', 'eq', 'terminated'),
    db
      .from('contract_terminations')
      .select(
        `id, contract_id, party_id, effective_date, status, contracts(contract_code, contract_title), ${PARTY_ON_TERMINATION}(party_code, name, pic)`,
      ),
  ])

  if (contractsRes.error) throw new Error(contractsRes.error.message)
  if (terminationsRes.error) throw new Error(terminationsRes.error.message)

  const items: RenewalAgendaItem[] = []

  for (const row of contractsRes.data ?? []) {
    const party = unwrapParty(row.parties)
    if (!party) continue

    const durationLabel = formatDuration(row.duration_months)
    const base = {
      partyId: row.party_id as string,
      partyCode: party.party_code,
      partyName: party.name,
      pic: party.pic,
      contractId: row.id as string,
      contractCode: row.contract_code as string,
      contractTitle: (row.contract_title as string | null) ?? null,
      durationLabel,
    }

    const isLifecycleRelevant = ACTIVE_STATUSES.includes(String(row.status))

    if (row.renewal_date && isLifecycleRelevant) {
      const daysLeft = diffCalendarDays(today, row.renewal_date as string)
      items.push({
        ...base,
        id: `${row.id}-renewal`,
        kind: 'renewal',
        eventDate: row.renewal_date as string,
        daysLeft,
        bucket: urgencyBucket(daysLeft),
      })
    }

    if (row.expiry_date && isLifecycleRelevant) {
      const daysLeft = diffCalendarDays(today, row.expiry_date as string)
      items.push({
        ...base,
        id: `${row.id}-expiry`,
        kind: 'expiry',
        eventDate: row.expiry_date as string,
        daysLeft,
        bucket: urgencyBucket(daysLeft),
      })
    }
  }

  for (const row of terminationsRes.data ?? []) {
    const party = unwrapParty(row.parties)
    const contractRaw = row.contracts
    const contract = Array.isArray(contractRaw) ? contractRaw[0] : contractRaw
    const contractTyped = contract as { contract_code?: string; contract_title?: string | null } | null
    if (!party || !row.effective_date) continue

    const daysLeft = diffCalendarDays(today, row.effective_date as string)
    items.push({
      id: row.id as string,
      partyId: row.party_id as string,
      partyCode: party.party_code,
      partyName: party.name,
      pic: party.pic,
      contractId: row.contract_id as string,
      contractCode: contractTyped?.contract_code ?? null,
      contractTitle: contractTyped?.contract_title ?? null,
      kind: 'termination',
      eventDate: row.effective_date as string,
      durationLabel: '—',
      daysLeft,
      bucket: urgencyBucket(daysLeft),
    })
  }

  return items.sort((a, b) => a.eventDate.localeCompare(b.eventDate))
}

export function summarizeRenewal(items: RenewalAgendaItem[]) {
  const currentMonth = isoMonth(todayIso())

  return {
    urgent: items.filter((i) => i.bucket === 'urgent').length,
    soon: items.filter((i) => i.bucket === 'soon').length,
    later: items.filter((i) => i.bucket === 'later').length,
    inMonth: items.filter((i) => isoMonth(i.eventDate) === currentMonth).length,
    total: items.length,
  }
}
