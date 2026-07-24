import 'server-only'

import { searchOdooOrders, searchOdooPartners } from '@/lib/odoo/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { PARTY_ON_SALE_ORDER } from '@/lib/supabase/embeds'

export type SoSyncError = {
  partyId: string
  partyCode: string
  message: string
}

export type SoSyncResult = {
  partiesProcessed: number
  ordersUpserted: number
  syncedAt: string
  errors: SoSyncError[]
  failedParties: number
}

async function logSyncError(
  db: ReturnType<typeof getSupabaseAdmin>,
  party: { id: string; party_code: string; odoo_partner_id: number | null },
  message: string,
  partnerId?: number,
) {
  await db.from('audit_logs').insert({
    action: `SO Sync gagal — ${party.party_code}: ${message}`,
    action_type: 'sync_error',
    party_id: party.id,
    actor_name: 'CMS',
    payload: {
      partnerId: partnerId ?? party.odoo_partner_id,
      error: message,
    },
  })
}

export async function syncSaleOrdersFromOdoo(partyId?: string): Promise<SoSyncResult> {
  const db = getSupabaseAdmin()
  const syncedAt = new Date().toISOString()
  const errors: SoSyncError[] = []
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
    const message = partyId
      ? 'Party tidak linked ke Odoo Partner'
      : 'Tidak ada party dengan Odoo Partner ID'
    if (partyId) {
      const { data: partyRow } = await db
        .from('parties')
        .select('id, party_code, odoo_partner_id')
        .eq('id', partyId)
        .single()
      if (partyRow) {
        errors.push({ partyId: partyRow.id, partyCode: partyRow.party_code, message })
        await logSyncError(db, partyRow as { id: string; party_code: string; odoo_partner_id: null }, message)
      }
    }
    return {
      partiesProcessed: 0,
      ordersUpserted: 0,
      syncedAt,
      errors,
      failedParties: errors.length,
    }
  }

  for (const party of linked) {
    const partnerId = party.odoo_partner_id as number
    try {
      const partners = await searchOdooPartners([['id', '=', partnerId]], 1)
      if (!partners.length) {
        const message = `Partner Odoo #${partnerId} tidak ditemukan — periksa Link Odoo party`
        errors.push({ partyId: party.id, partyCode: party.party_code, message })
        await logSyncError(db, party, message, partnerId)
        continue
      }

      const orders = await searchOdooOrders([['partner_id', '=', partnerId]], 100)

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
          const message = `${order.name}: ${error.message}`
          errors.push({ partyId: party.id, partyCode: party.party_code, message })
          await logSyncError(db, party, message, partnerId)
        } else {
          ordersUpserted += 1
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Odoo fetch failed'
      errors.push({ partyId: party.id, partyCode: party.party_code, message })
      await logSyncError(db, party, message, partnerId)
    }
  }

  await db.from('audit_logs').insert({
    action: `SO Sync batch — ${ordersUpserted} order(s) dari Odoo (consume-only)`,
    action_type: 'sync',
    party_id: partyId ?? null,
    actor_name: 'CMS',
    payload: {
      partiesProcessed: linked.length,
      ordersUpserted,
      syncedAt,
      errorCount: errors.length,
      failedParties: new Set(errors.map((e) => e.partyId)).size,
    },
  })

  return {
    partiesProcessed: linked.length,
    ordersUpserted,
    syncedAt,
    errors,
    failedParties: new Set(errors.map((e) => e.partyId)).size,
  }
}

export async function listSyncedSaleOrders(partyId?: string) {
  const db = getSupabaseAdmin()
  let query = db
    .from('sale_orders')
    .select(`*, ${PARTY_ON_SALE_ORDER}(party_code, name)`)
    .order('synced_at', { ascending: false })
    .limit(100)

  if (partyId) query = query.eq('party_id', partyId)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function listRecentSyncErrors(limit = 5) {
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('audit_logs')
    .select('*')
    .eq('action_type', 'sync_error')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data ?? []
}

export type SoHealthSummary = {
  synchronized: number
  noActiveSo: number
  inProgress: number
  syncErrors: number
}

export async function loadSoHealthSummary(): Promise<SoHealthSummary> {
  const db = getSupabaseAdmin()

  const [partiesRes, ordersRes, contractsRes, errorsRes] = await Promise.all([
    db.from('parties').select('id'),
    db.from('sale_orders').select('party_id, state'),
    db
      .from('contracts')
      .select('party_id, status')
      .in('status', ['active', 'fully_signed', 'signed']),
    db
      .from('audit_logs')
      .select('id')
      .eq('action_type', 'sync_error')
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
  ])

  if (partiesRes.error) throw new Error(partiesRes.error.message)
  if (ordersRes.error) throw new Error(ordersRes.error.message)
  if (contractsRes.error) throw new Error(contractsRes.error.message)
  if (errorsRes.error) throw new Error(errorsRes.error.message)

  const activeContractParties = new Set((contractsRes.data ?? []).map((c) => c.party_id))
  const ordersByParty = new Map<string, string[]>()
  for (const o of ordersRes.data ?? []) {
    if (!o.party_id) continue
    const list = ordersByParty.get(o.party_id) ?? []
    list.push(String(o.state))
    ordersByParty.set(o.party_id, list)
  }

  let synchronized = 0
  let noActiveSo = 0
  let inProgress = 0

  for (const partyId of activeContractParties) {
    const states = ordersByParty.get(partyId) ?? []
    const hasDone = states.some((s) => s === 'done')
    const hasSale = states.some((s) => s === 'sale')
    if (hasDone || hasSale) synchronized += 1
    else noActiveSo += 1
    if (hasSale && !hasDone) inProgress += 1
  }

  return {
    synchronized,
    noActiveSo,
    inProgress,
    syncErrors: (errorsRes.data ?? []).length,
  }
}
