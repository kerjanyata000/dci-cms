import 'server-only'

import { searchOdooOrders } from '@/lib/odoo/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export type SoSyncResult = {
  partiesProcessed: number
  ordersUpserted: number
  syncedAt: string
  errors: string[]
}

export async function syncSaleOrdersFromOdoo(partyId?: string): Promise<SoSyncResult> {
  const db = getSupabaseAdmin()
  const syncedAt = new Date().toISOString()
  const errors: string[] = []
  let ordersUpserted = 0

  let partyQuery = db
    .from('parties')
    .select('id, odoo_partner_id, party_code, name')
    .not('odoo_partner_id', 'is', null)

  if (partyId) partyQuery = partyQuery.eq('id', partyId)

  const { data: parties, error: partiesError } = await partyQuery
  if (partiesError) throw new Error(partiesError.message)

  const linked = parties ?? []
  if (linked.length === 0) {
    return { partiesProcessed: 0, ordersUpserted: 0, syncedAt, errors: ['No linked parties'] }
  }

  for (const party of linked) {
    const partnerId = party.odoo_partner_id as number
    try {
      const orders = await searchOdooOrders(
        [['partner_id', '=', partnerId]],
        100,
      )

      for (const order of orders) {
        const { error } = await db.from('sale_orders').upsert(
          {
            party_id: party.id,
            odoo_order_id: order.id,
            odoo_partner_id: partnerId,
            name: order.name,
            state: order.state,
            amount_total: order.amount_total ?? null,
            date_order: order.date_order ?? null,
            synced_at: syncedAt,
          },
          { onConflict: 'odoo_order_id' },
        )
        if (error) {
          errors.push(`${party.party_code}: ${order.name} — ${error.message}`)
        } else {
          ordersUpserted += 1
        }
      }
    } catch (err) {
      errors.push(
        `${party.party_code}: ${err instanceof Error ? err.message : 'Odoo fetch failed'}`,
      )
    }
  }

  await db.from('audit_logs').insert({
    action: `SO Sync batch — ${ordersUpserted} order(s) dari Odoo (consume-only)`,
    action_type: 'sync',
    actor_name: 'CMS',
    payload: {
      partiesProcessed: linked.length,
      ordersUpserted,
      syncedAt,
      errorCount: errors.length,
    },
  })

  return {
    partiesProcessed: linked.length,
    ordersUpserted,
    syncedAt,
    errors,
  }
}

export async function listSyncedSaleOrders(partyId?: string) {
  const db = getSupabaseAdmin()
  let query = db
    .from('sale_orders')
    .select('*, parties(party_code, name)')
    .order('synced_at', { ascending: false })
    .limit(100)

  if (partyId) query = query.eq('party_id', partyId)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}
