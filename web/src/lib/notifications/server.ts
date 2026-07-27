import 'server-only'

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { ODOO_LINK_LABELS } from '@/lib/parties/types'
import { listRecentSyncErrors } from '@/lib/so/server'
import { PARTY_ON_AMENDMENT, PARTY_ON_CONTRACT } from '@/lib/supabase/embeds'

export type NotificationItem = {
  id: string
  code: string
  title: string
  sub: string
  urgent: boolean
  href?: string
  created_at: string
}

export async function loadNotifications(): Promise<NotificationItem[]> {
  const db = getSupabaseAdmin()
  const items: NotificationItem[] = []

  const [auditRes, mismatchRes, noSoParties, syncErrors, renewalRes, expiryRes, readyAmendRes] =
    await Promise.all([
    db.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(8),
    db
      .from('parties')
      .select('id, party_code, name, odoo_link_status, odoo_partner_id')
      .in('odoo_link_status', ['mismatch', 'relink', 'pending', 'unlinked'])
      .limit(5),
    loadNoActiveSoParties(db),
    listRecentSyncErrors(5),
    db
      .from('contracts')
      .select(
        `id, party_id, contract_code, renewal_date, ${PARTY_ON_CONTRACT}(party_code, name)`,
      )
      .not('renewal_date', 'is', null)
      .in('status', ['active', 'fully_signed', 'signed', 'under_review'])
      .order('renewal_date', { ascending: true })
      .limit(20),
    db
      .from('contracts')
      .select(
        `id, party_id, contract_code, expiry_date, ${PARTY_ON_CONTRACT}(party_code, name)`,
      )
      .not('expiry_date', 'is', null)
      .in('status', ['active', 'fully_signed', 'signed'])
      .order('expiry_date', { ascending: true })
      .limit(20),
    db
      .from('contract_amendments')
      .select(`id, party_id, amendment_code, title, ${PARTY_ON_AMENDMENT}(party_code)`)
      .eq('status', 'ready_for_sign')
      .limit(5),
  ])

  const today = startOfDay(new Date())

  for (const row of renewalRes.data ?? []) {
    if (!row.renewal_date) continue
    const daysLeft = daysUntil(today, row.renewal_date as string)
    if (daysLeft < 0 || daysLeft > 180) continue
    const party = unwrapParty(row.parties)
    if (!party) continue
    items.push({
      id: `renewal-${row.id}`,
      code: daysLeft <= 14 ? 'NOTIF-CMS-017' : 'NOTIF-CMS-017',
      title:
        daysLeft <= 14
          ? `Renewal H-${daysLeft} — ${party.party_code}`
          : `Renewal reminder — ${party.party_code}`,
      sub: `${row.contract_code} · jatuh tempo ${row.renewal_date}`,
      urgent: daysLeft <= 14,
      href: `/parties/${row.party_id}`,
      created_at: new Date().toISOString(),
    })
  }

  for (const row of expiryRes.data ?? []) {
    if (!row.expiry_date) continue
    const daysLeft = daysUntil(today, row.expiry_date as string)
    if (daysLeft < 0 || daysLeft > 60) continue
    const party = unwrapParty(row.parties)
    if (!party) continue
    items.push({
      id: `expiry-${row.id}`,
      code: 'NOTIF-CMS-018',
      title: `Contract expiry reminder — ${party.party_code}`,
      sub: `${row.contract_code} · expiry ${row.expiry_date} (${daysLeft} hari lagi)`,
      urgent: daysLeft <= 30,
      href: `/parties/${row.party_id}`,
      created_at: new Date().toISOString(),
    })
  }

  for (const row of readyAmendRes.data ?? []) {
    const partyCode = unwrapParty(row.parties)?.party_code
    items.push({
      id: `amd-${row.id}`,
      code: 'NOTIF-CMS-004',
      title: `Ready for signature — ${row.amendment_code}`,
      sub: `${partyCode ?? 'Party'} · ${row.title}`,
      urgent: false,
      href: `/parties/${row.party_id}`,
      created_at: new Date().toISOString(),
    })
  }

  for (const row of syncErrors) {
    items.push({
      id: `sync-${row.id}`,
      code: 'NOTIF-CMS-SYNC',
      title: 'SO Sync Error',
      sub: String(row.action).replace(/^SO Sync gagal — /, ''),
      urgent: true,
      href: row.party_id ? `/parties/${row.party_id}` : '/so',
      created_at: row.created_at,
    })
  }

  for (const row of auditRes.data ?? []) {
    if (row.action_type === 'sync_error') continue
    const mapped = mapAuditNotification(row)
    items.push({
      id: `audit-${row.id}`,
      code: mapped.code,
      title: mapped.title,
      sub: mapped.sub,
      urgent: mapped.urgent,
      href: row.party_id ? `/parties/${row.party_id}` : undefined,
      created_at: row.created_at,
    })
  }

  for (const p of mismatchRes.data ?? []) {
    const label = ODOO_LINK_LABELS[p.odoo_link_status as keyof typeof ODOO_LINK_LABELS]
    items.push({
      id: `odoo-${p.id}`,
      code: p.odoo_link_status === 'mismatch' ? 'NOTIF-CMS-016' : 'NOTIF-CMS-019',
      title: `Odoo Link — ${label}`,
      sub: `${p.party_code} · ${p.name}`,
      urgent: p.odoo_link_status === 'mismatch',
      href: `/parties/${p.id}`,
      created_at: new Date().toISOString(),
    })
  }

  for (const p of noSoParties) {
    items.push({
      id: `so-${p.id}`,
      code: 'NOTIF-CMS-014',
      title: 'No Active SO / Renewal Not Found',
      sub: `${p.party_code} · kontrak aktif tanpa SO sale/done`,
      urgent: true,
      href: `/parties/${p.id}`,
      created_at: new Date().toISOString(),
    })
  }

  return items
    .sort((a, b) => {
      if (a.urgent !== b.urgent) return Number(b.urgent) - Number(a.urgent)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    .slice(0, 16)
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function daysUntil(from: Date, isoDate: string): number {
  const target = startOfDay(new Date(`${isoDate}T00:00:00`))
  return Math.round((target.getTime() - from.getTime()) / 86400000)
}

function unwrapParty(raw: unknown): { party_code: string; name: string } | null {
  if (!raw) return null
  const row = Array.isArray(raw) ? raw[0] : raw
  if (!row || typeof row !== 'object') return null
  const p = row as { party_code?: string; name?: string }
  if (!p.party_code) return null
  return { party_code: p.party_code, name: p.name ?? p.party_code }
}

function mapAuditNotification(row: {
  action: string
  action_type: string | null
  actor_name: string | null
}): { code: string; title: string; sub: string; urgent: boolean } {
  const action = String(row.action)
  const type = row.action_type ?? ''
  const actor = row.actor_name ?? 'CMS'
  const title = action.slice(0, 80)
  const sub = `${type || 'event'} · ${actor}`

  if (type === 'termination' || /terminat/i.test(action)) {
    return { code: 'NOTIF-CMS-011', title, sub, urgent: true }
  }
  if (/counterparty|change cp|novation/i.test(action) || type === 'counterparty') {
    return { code: 'NOTIF-CMS-009', title, sub, urgent: true }
  }
  if (/amendment|amd-/i.test(action) || type === 'amendment') {
    return { code: 'NOTIF-CMS-004', title, sub, urgent: false }
  }
  if (/revision required/i.test(action) || type === 'revision_required') {
    return { code: 'NOTIF-CMS-003', title, sub, urgent: true }
  }
  if (/fully signed|ready for sign|waiting for signature/i.test(action)) {
    return { code: 'NOTIF-CMS-005', title, sub, urgent: false }
  }
  if (/void/i.test(action) || type === 'void') {
    return { code: 'NOTIF-CMS-013', title, sub, urgent: false }
  }
  if (/upload|supporting|dokumen/i.test(action) || type === 'upload') {
    return { code: 'NOTIF-CMS-012', title, sub, urgent: false }
  }
  if (/create|dibuat|kontrak baru/i.test(action) || type === 'create') {
    return { code: 'NOTIF-CMS-001', title, sub, urgent: false }
  }
  if (/expired/i.test(action)) {
    return { code: 'NOTIF-CMS-018', title, sub, urgent: true }
  }
  if (/party|edit party|nonaktif|aktifkan/i.test(action) || type === 'party') {
    return { code: 'NOTIF-CMS-019', title, sub, urgent: false }
  }

  return { code: 'NOTIF-CMS-AUDIT', title, sub, urgent: type === 'termination' }
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
    if (result.length >= 3) break
  }

  return result
}
