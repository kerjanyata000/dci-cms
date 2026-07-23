import 'server-only'

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { ODOO_LINK_LABELS } from '@/lib/parties/types'
import { listRecentSyncErrors } from '@/lib/so/server'

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

  const [auditRes, mismatchRes, noSoParties, syncErrors] = await Promise.all([
    db.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(8),
    db
      .from('parties')
      .select('id, party_code, name, odoo_link_status, odoo_partner_id')
      .in('odoo_link_status', ['mismatch', 'relink', 'pending', 'unlinked'])
      .limit(5),
    loadNoActiveSoParties(db),
    listRecentSyncErrors(5),
  ])

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
    items.push({
      id: `audit-${row.id}`,
      code: 'NOTIF-CMS-AUDIT',
      title: String(row.action).slice(0, 80),
      sub: `${row.action_type ?? 'event'} · ${row.actor_name ?? 'CMS'}`,
      urgent: row.action_type === 'termination',
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

  return items.slice(0, 12)
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
