import type { Party } from '@/types/cms'

export type PrimaryContractSummary = {
  contract_title: string | null
  agreement_date: string | null
  duration_months: number | null
  status: string
  status_text: string
}

export type PartyListItem = Party & {
  primary_contract: PrimaryContractSummary | null
}

type ContractPickRow = {
  party_id: string
  contract_title: string | null
  agreement_date: string | null
  duration_months: number | null
  status: string
  status_text: string
  created_at: string
}

const STATUS_RANK: Record<string, number> = {
  active: 0,
  fully_signed: 1,
  signed: 2,
  under_review: 3,
  sent: 4,
  ready_for_sign: 5,
  draft: 6,
  terminated: 99,
}

export function pickPrimaryContract(contracts: ContractPickRow[]): PrimaryContractSummary | null {
  if (contracts.length === 0) return null

  const sorted = [...contracts].sort((a, b) => {
    const ra = STATUS_RANK[a.status] ?? 50
    const rb = STATUS_RANK[b.status] ?? 50
    if (ra !== rb) return ra - rb
    const da = a.agreement_date ?? ''
    const db = b.agreement_date ?? ''
    if (da !== db) return db.localeCompare(da)
    return b.created_at.localeCompare(a.created_at)
  })

  const c = sorted[0]
  return {
    contract_title: c.contract_title,
    agreement_date: c.agreement_date,
    duration_months: c.duration_months,
    status: c.status,
    status_text: c.status_text,
  }
}

export function enrichPartiesWithContracts(
  parties: Party[],
  contracts: ContractPickRow[],
): PartyListItem[] {
  const byParty = new Map<string, ContractPickRow[]>()
  for (const c of contracts) {
    const list = byParty.get(c.party_id) ?? []
    list.push(c)
    byParty.set(c.party_id, list)
  }

  return parties.map((p) => ({
    ...p,
    primary_contract: pickPrimaryContract(byParty.get(p.id) ?? []),
  }))
}

export function formatAgreementDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export function formatDuration(months: number | null): string {
  if (months == null) return '—'
  return `${months} bulan`
}
