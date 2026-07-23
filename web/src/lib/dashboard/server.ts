import 'server-only'

import { getSupabaseAdmin } from '@/lib/supabase/server'
import type { DashboardPayload } from '@/lib/dashboard/config'

export async function loadDashboardPayload(): Promise<DashboardPayload> {
  const db = getSupabaseAdmin()

  const [partiesRes, contractsRes] = await Promise.all([
    db.from('parties').select('id, party_code, name, odoo_link_status, party_status'),
    db.from('contracts').select('id, party_id, contract_code, status, status_text'),
  ])

  if (partiesRes.error) throw new Error(partiesRes.error.message)
  if (contractsRes.error) throw new Error(contractsRes.error.message)

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

  return { stats, pendingOdooParties, recentContracts }
}
