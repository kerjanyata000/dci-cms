import type { OdooLinkStatus, Party } from '@/types/cms'

export type PartyRow = {
  id: string
  party_code: string
  name: string
  pic: string | null
  odoo_partner_id: number | null
  odoo_link_status: OdooLinkStatus
  party_status: string
  created_at?: string
  updated_at?: string
}

export function mapPartyRow(row: PartyRow): Party {
  return {
    id: row.id,
    party_code: row.party_code,
    name: row.name,
    pic: row.pic,
    odoo_partner_id: row.odoo_partner_id,
    odoo_link_status: row.odoo_link_status,
    party_status: row.party_status,
  }
}

export function normalizePartyName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** BRD §9.5 — heuristic compare CMS party name vs Odoo partner name */
export function evaluateOdooLinkStatus(
  partyName: string,
  partnerName: string | null | undefined,
): OdooLinkStatus {
  if (!partnerName?.trim()) return 'pending'

  const a = normalizePartyName(partyName)
  const b = normalizePartyName(partnerName)

  if (a === b) return 'linked'
  if (a.length >= 4 && (b.includes(a) || a.includes(b))) return 'linked'

  return 'mismatch'
}

export const ODOO_LINK_LABELS: Record<OdooLinkStatus, string> = {
  unlinked: 'Unlinked',
  pending: 'Pending Odoo Link',
  linked: 'Linked',
  mismatch: 'Mismatch',
  relink: 'Relink Required',
  not_required: 'Not Required',
}

/** Penjelasan singkat untuk UI — mismatch tetap punya partner ID */
export const ODOO_LINK_HINTS: Record<OdooLinkStatus, string> = {
  unlinked: 'Belum ada Partner Odoo yang dipilih.',
  pending: 'Party ada di CMS; pilih Partner di Odoo via Link.',
  linked: 'Nama CMS cocok dengan res.partner Odoo.',
  mismatch: 'Sudah terhubung ke Partner Odoo, tetapi nama CMS ≠ nama Partner (perlu review Legal).',
  relink: 'Partner Odoo perlu di-link ulang dengan alasan.',
  not_required: 'Integrasi Odoo tidak diwajibkan untuk party ini.',
}

export function formatOdooLinkSummary(party: Pick<Party, 'odoo_link_status' | 'odoo_partner_id'>) {
  const label = ODOO_LINK_LABELS[party.odoo_link_status]
  if (party.odoo_partner_id != null) {
    return `${label} · Odoo #${party.odoo_partner_id}`
  }
  return label
}

import type { SupabaseClient } from '@supabase/supabase-js'

export async function nextPartyCode(db: SupabaseClient): Promise<string> {
  const { data } = await db
    .from('parties')
    .select('party_code')
    .order('party_code', { ascending: false })
    .limit(1)

  const last = data?.[0]?.party_code
  const match = last?.match(/PTY-(\d+)/i)
  const n = match ? Number.parseInt(match[1], 10) + 1 : 1
  return `PTY-${String(n).padStart(5, '0')}`
}
