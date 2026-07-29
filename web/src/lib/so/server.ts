import 'server-only'

import { readOdooSaleOrderDetail, searchOdooOrders, searchOdooPartners } from '@/lib/odoo/server'
import type { OdooSaleOrderLine } from '@/lib/odoo/types'
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

export type SaleOrderDetailPayload = {
  id: string
  odooOrderId: number
  name: string
  state: string
  documentLabel: 'Quotation' | 'Sales Order'
  dateOrder: string | null
  commitmentDate: string | null
  paymentTerm: string | null
  clientOrderRef: string | null
  currency: string
  amountUntaxed: number | null
  amountTax: number | null
  amountTotal: number | null
  syncedAt: string
  source: 'odoo' | 'mirror'
  customer: {
    name: string
    addressLines: string[]
    vat: string | null
    email: string | null
  }
  party: { id: string; party_code: string; name: string } | null
  lines: Array<{
    id: string | number
    product: string
    description: string
    qty: number
    qtyDelivered: number
    qtyInvoiced: number
    unitPrice: number
    subtotal: number
  }>
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
  quotations: number
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
  let quotations = 0

  for (const o of ordersRes.data ?? []) {
    const state = String(o.state)
    if (state === 'draft' || state === 'sent') quotations += 1
    if (!o.party_id) continue
    const list = ordersByParty.get(o.party_id) ?? []
    list.push(state)
    ordersByParty.set(o.party_id, list)
  }

  let synchronized = 0
  let noActiveSo = 0
  let inProgress = 0

  for (const partyId of activeContractParties) {
    const states = ordersByParty.get(partyId) ?? []
    const hasDone = states.some((s) => s === 'done')
    const hasSale = states.some((s) => s === 'sale')
    // Quotation (draft/sent) saja belum dihitung Active SO — BRD §9.6 / INT-SO
    if (hasDone || hasSale) synchronized += 1
    else noActiveSo += 1
    if (hasSale && !hasDone) inProgress += 1
  }

  return {
    synchronized,
    noActiveSo,
    inProgress,
    quotations,
    syncErrors: (errorsRes.data ?? []).length,
  }
}

function many2oneName(value: unknown): string | null {
  if (Array.isArray(value) && typeof value[1] === 'string') return value[1]
  return null
}

function falseToNull(value: unknown): string | null {
  if (value === false || value == null) return null
  return String(value)
}

function documentLabel(state: string): 'Quotation' | 'Sales Order' {
  if (state === 'draft' || state === 'sent' || state === 'cancel') return 'Quotation'
  return 'Sales Order'
}

function mapLines(lines: OdooSaleOrderLine[]) {
  return lines.map((line) => ({
    id: line.id,
    product: many2oneName(line.product_id) ?? '—',
    description: line.name,
    qty: Number(line.product_uom_qty ?? 0),
    qtyDelivered: Number(line.qty_delivered ?? 0),
    qtyInvoiced: Number(line.qty_invoiced ?? 0),
    unitPrice: Number(line.price_unit ?? 0),
    subtotal: Number(line.price_subtotal ?? line.price_total ?? 0),
  }))
}

function syntheticLine(name: string, amount: number | null) {
  const total = amount ?? 0
  return [
    {
      id: 'mirror-1',
      product: 'Produk / layanan',
      description: name,
      qty: 1,
      qtyDelivered: 0,
      qtyInvoiced: 0,
      unitPrice: total,
      subtotal: total,
    },
  ]
}

/** FR-CNT-SO view detail — consume-only, mirip form Quotation/SO Odoo. */
export async function getSaleOrderDetail(cmsOrderId: string): Promise<SaleOrderDetailPayload> {
  const db = getSupabaseAdmin()
  const { data: row, error } = await db
    .from('sale_orders')
    .select(`*, ${PARTY_ON_SALE_ORDER}(id, party_code, name, npwp, address, contact_email)`)
    .eq('id', cmsOrderId)
    .single()

  if (error || !row) throw new Error('SO tidak ditemukan di mirror CMS')

  const partyEmbed = row.parties as
    | {
        id: string
        party_code: string
        name: string
        npwp?: string | null
        address?: string | null
        contact_email?: string | null
      }
    | null
    | undefined

  const party =
    partyEmbed != null
      ? { id: partyEmbed.id, party_code: partyEmbed.party_code, name: partyEmbed.name }
      : null

  try {
    const live = await readOdooSaleOrderDetail(row.odoo_order_id as number)
    const partnerName =
      live.partner?.name ??
      many2oneName(live.order.partner_id) ??
      partyEmbed?.name ??
      'Customer'
    const addressLines = [
      falseToNull(live.partner?.street),
      falseToNull(live.partner?.street2),
      [falseToNull(live.partner?.city), falseToNull(live.partner?.zip)].filter(Boolean).join(' '),
      many2oneName(live.partner?.country_id),
    ].filter((x): x is string => Boolean(x?.trim()))

    return {
      id: row.id as string,
      odooOrderId: row.odoo_order_id as number,
      name: live.order.name,
      state: live.order.state,
      documentLabel: documentLabel(live.order.state),
      dateOrder: live.order.date_order ?? (row.date_order as string | null),
      commitmentDate: falseToNull(live.order.commitment_date),
      paymentTerm: many2oneName(live.order.payment_term_id),
      clientOrderRef: falseToNull(live.order.client_order_ref),
      currency: many2oneName(live.order.currency_id) ?? 'IDR',
      amountUntaxed: live.order.amount_untaxed ?? null,
      amountTax: live.order.amount_tax ?? null,
      amountTotal: live.order.amount_total ?? (row.amount_total as number | null),
      syncedAt: row.synced_at as string,
      source: 'odoo',
      customer: {
        name: partnerName,
        addressLines,
        vat: falseToNull(live.partner?.vat) ?? partyEmbed?.npwp ?? null,
        email: falseToNull(live.partner?.email) ?? partyEmbed?.contact_email ?? null,
      },
      party,
      lines: live.lines.length
        ? mapLines(live.lines)
        : syntheticLine(live.order.name, live.order.amount_total ?? null),
    }
  } catch {
    const addressLines = partyEmbed?.address
      ? partyEmbed.address.split(/\n+/).map((s) => s.trim()).filter(Boolean)
      : []
    const amount = row.amount_total as number | null
    return {
      id: row.id as string,
      odooOrderId: row.odoo_order_id as number,
      name: row.name as string,
      state: row.state as string,
      documentLabel: documentLabel(String(row.state)),
      dateOrder: row.date_order as string | null,
      commitmentDate: null,
      paymentTerm: null,
      clientOrderRef: null,
      currency: 'IDR',
      amountUntaxed: amount,
      amountTax: null,
      amountTotal: amount,
      syncedAt: row.synced_at as string,
      source: 'mirror',
      customer: {
        name: partyEmbed?.name ?? 'Customer',
        addressLines,
        vat: partyEmbed?.npwp ?? null,
        email: partyEmbed?.contact_email ?? null,
      },
      party,
      lines: syntheticLine(String(row.name), amount),
    }
  }
}

