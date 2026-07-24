import 'server-only'

import type {
  DashboardPayload,
  LifecycleBreakdown,
  PicWorkloadRow,
  RenewalTimelineRow,
} from '@/lib/dashboard/config'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { PARTY_ON_AMENDMENT, PARTY_ON_CONTRACT } from '@/lib/supabase/embeds'
import { loadSoHealthSummary } from '@/lib/so/server'

function daysUntil(isoDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${isoDate}T00:00:00`)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

function urgencyBucket(daysLeft: number): RenewalTimelineRow['bucket'] {
  if (daysLeft < 0) return 'later'
  if (daysLeft <= 30) return 'urgent'
  if (daysLeft <= 180) return 'soon'
  return 'later'
}

function buildLifecycle(contracts: Array<{ status: string }>): LifecycleBreakdown {
  const active = contracts.filter((c) =>
    ['active', 'fully_signed', 'signed'].includes(c.status),
  ).length
  const review = contracts.filter((c) =>
    ['under_review', 'review', 'sent', 'ready_for_sign'].includes(c.status),
  ).length
  const draft = contracts.filter((c) => c.status === 'draft').length
  const total = contracts.length
  const other = Math.max(0, total - active - review - draft)
  return { active, review, draft, other, total }
}

function buildPicWorkload(
  parties: Array<{ pic: string | null }>,
): PicWorkloadRow[] {
  const counts = new Map<string, number>()
  for (const p of parties) {
    const pic = p.pic?.trim()
    if (!pic) continue
    counts.set(pic, (counts.get(pic) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([pic, count]) => ({ pic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
}

async function loadNoActiveSoParties(db: ReturnType<typeof getSupabaseAdmin>) {
  const { data: parties } = await db.from('parties').select('id, party_code, name')
  if (!parties?.length) return []

  const result: Array<{ id: string; party_code: string; name: string }> = []

  for (const party of parties) {
    const { data: contracts } = await db
      .from('contracts')
      .select('status')
      .eq('party_id', party.id)
      .in('status', ['active', 'fully_signed', 'signed'])

    if (!contracts?.length) continue

    const { data: orders } = await db
      .from('sale_orders')
      .select('state')
      .eq('party_id', party.id)

    const hasActiveSo = (orders ?? []).some((o) => ['sale', 'done'].includes(String(o.state)))
    if (!hasActiveSo) result.push(party)
    if (result.length >= 5) break
  }

  return result
}

export async function loadDashboardPayload(): Promise<DashboardPayload> {
  const db = getSupabaseAdmin()

  const [partiesRes, contractsRes, renewalRes, amendmentsRes, soHealth, noActiveSoParties] =
    await Promise.all([
      db.from('parties').select('id, party_code, name, pic, odoo_link_status, party_status'),
      db.from('contracts').select('id, party_id, contract_code, status, status_text, renewal_date, confirmed_metadata'),
      db
        .from('contracts')
        .select(`party_id, contract_code, renewal_date, ${PARTY_ON_CONTRACT}(party_code)`)
        .not('renewal_date', 'is', null)
        .in('status', ['active', 'fully_signed', 'signed', 'under_review']),
      db
        .from('contract_amendments')
        .select(`id, party_id, amendment_code, title, ${PARTY_ON_AMENDMENT}(party_code)`)
        .eq('status', 'ready_for_sign')
        .order('created_at', { ascending: false })
        .limit(6),
      loadSoHealthSummary(),
      loadNoActiveSoParties(db),
    ])

  if (partiesRes.error) throw new Error(partiesRes.error.message)
  if (contractsRes.error) throw new Error(contractsRes.error.message)
  if (renewalRes.error) throw new Error(renewalRes.error.message)
  if (amendmentsRes.error) throw new Error(amendmentsRes.error.message)

  const parties = partiesRes.data ?? []
  const contracts = contractsRes.data ?? []

  const partyMap = new Map(parties.map((p) => [p.id, p]))
  const lifecycle = buildLifecycle(contracts)
  const picWorkload = buildPicWorkload(parties)

  const autoRenewalContracts = contracts.filter((c) => {
    const meta = c.confirmed_metadata as Record<string, string> | null
    const val = meta?.autoRenewal ?? ''
    return /ya|yes/i.test(val)
  }).length

  const stats = {
    totalParties: parties.length,
    linkedParties: parties.filter((p) => p.odoo_link_status === 'linked').length,
    pendingOdooLink: parties.filter((p) =>
      ['pending', 'unlinked'].includes(p.odoo_link_status),
    ).length,
    mismatchOdooLink: parties.filter((p) =>
      ['mismatch', 'relink'].includes(p.odoo_link_status),
    ).length,
    totalContracts: contracts.length,
    draftContracts: contracts.filter((c) => c.status === 'draft').length,
    activeContracts: contracts.filter((c) =>
      ['active', 'fully_signed', 'signed'].includes(c.status),
    ).length,
    reviewContracts: contracts.filter((c) =>
      ['under_review', 'review', 'sent'].includes(c.status),
    ).length,
    autoRenewalContracts,
  }

  const pendingOdooParties = parties
    .filter((p) => !['linked', 'not_required'].includes(p.odoo_link_status))
    .slice(0, 8)
    .map((p) => ({
      id: p.id,
      party_code: p.party_code,
      name: p.name,
      odoo_link_status: p.odoo_link_status,
    }))

  const recentContracts = contracts.slice(0, 10).map((c) => {
    const party = partyMap.get(c.party_id)
    return {
      ...c,
      party_code: party?.party_code,
      party_name: party?.name,
    }
  })

  const renewalSoon = (renewalRes.data ?? [])
    .map((row) => {
      const partyRaw = row.parties
      const partyCode = Array.isArray(partyRaw)
        ? partyRaw[0]?.party_code
        : (partyRaw as { party_code?: string } | null)?.party_code
      if (!row.renewal_date || !partyCode) return null
      const days_left = daysUntil(row.renewal_date as string)
      if (days_left < 0 || days_left > 180) return null
      return {
        party_id: row.party_id as string,
        party_code: partyCode,
        contract_code: row.contract_code as string,
        renewal_date: row.renewal_date as string,
        days_left,
      }
    })
    .filter(Boolean)
    .sort((a, b) => a!.days_left - b!.days_left) as DashboardPayload['renewalSoon']

  const renewalTimeline: RenewalTimelineRow[] = (renewalRes.data ?? [])
    .map((row) => {
      const partyRaw = row.parties
      const partyCode = Array.isArray(partyRaw)
        ? partyRaw[0]?.party_code
        : (partyRaw as { party_code?: string } | null)?.party_code
      if (!row.renewal_date || !partyCode) return null
      const days_left = daysUntil(row.renewal_date as string)
      if (days_left < 0) return null
      return {
        party_id: row.party_id as string,
        party_code: partyCode,
        contract_code: row.contract_code as string,
        renewal_date: row.renewal_date as string,
        days_left,
        bucket: urgencyBucket(days_left),
      }
    })
    .filter(Boolean)
    .sort((a, b) => a!.days_left - b!.days_left)
    .slice(0, 6) as RenewalTimelineRow[]

  const amendmentsReady = (amendmentsRes.data ?? []).map((row) => {
    const partyRaw = row.parties
    const partyCode = Array.isArray(partyRaw)
      ? partyRaw[0]?.party_code
      : (partyRaw as { party_code?: string } | null)?.party_code
    return {
      id: row.id as string,
      party_id: row.party_id as string,
      party_code: partyCode ?? 'Party',
      amendment_code: row.amendment_code as string,
      title: row.title as string,
    }
  })

  return {
    stats,
    lifecycle,
    picWorkload,
    renewalTimeline,
    soHealth,
    noActiveSoParties,
    integration: {
      odooMode: process.env.NEXT_PUBLIC_ODOO_MODE === 'live' ? 'live' : 'dummy',
      ragflowMode: process.env.NEXT_PUBLIC_RAGFLOW_MODE === 'live' ? 'live' : 'dummy',
    },
    pendingOdooParties,
    recentContracts,
    renewalSoon,
    amendmentsReady,
  }
}
