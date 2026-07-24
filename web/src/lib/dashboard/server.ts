import 'server-only'

import { getSupabaseAdmin } from '@/lib/supabase/server'
import type { DashboardPayload } from '@/lib/dashboard/config'

function daysUntil(isoDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${isoDate}T00:00:00`)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

export async function loadDashboardPayload(): Promise<DashboardPayload> {
  const db = getSupabaseAdmin()

  const [partiesRes, contractsRes, renewalRes, amendmentsRes] = await Promise.all([
    db.from('parties').select('id, party_code, name, odoo_link_status, party_status'),
    db.from('contracts').select('id, party_id, contract_code, status, status_text, renewal_date'),
    db
      .from('contracts')
      .select('party_id, contract_code, renewal_date, parties(party_code)')
      .not('renewal_date', 'is', null)
      .in('status', ['active', 'fully_signed', 'signed', 'under_review']),
    db
      .from('contract_amendments')
      .select('id, party_id, amendment_code, title, parties(party_code)')
      .eq('status', 'ready_for_sign')
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  if (partiesRes.error) throw new Error(partiesRes.error.message)
  if (contractsRes.error) throw new Error(contractsRes.error.message)
  if (renewalRes.error) throw new Error(renewalRes.error.message)
  if (amendmentsRes.error) throw new Error(amendmentsRes.error.message)

  const parties = partiesRes.data ?? []
  const contracts = contractsRes.data ?? []

  const partyMap = new Map(parties.map((p) => [p.id, p]))

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
    pendingOdooParties,
    recentContracts,
    renewalSoon,
    amendmentsReady,
  }
}
