import 'server-only'

import { getOdooServerConfig } from '../server/env'
import type { OdooDomain, OdooPartner, OdooSaleOrder } from './types'

type JsonRpcResult<T> = T

async function odooJsonRpc<T>(
  service: 'common' | 'object',
  method: string,
  args: unknown[],
): Promise<JsonRpcResult<T>> {
  const { url, db, username, apiKey } = getOdooServerConfig()

  const response = await fetch(`${url}/jsonrpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: { service, method, args },
      id: Date.now(),
    }),
    cache: 'no-store',
  })

  const payload = (await response.json()) as {
    result?: T
    error?: { message?: string; data?: { message?: string } }
  }

  if (payload.error) {
    const msg =
      payload.error.data?.message ?? payload.error.message ?? 'Odoo JSON-RPC error'
    throw new Error(msg)
  }

  return payload.result as T
}

let cachedUid: number | null = null

export async function odooAuthenticate(): Promise<number> {
  if (cachedUid != null) return cachedUid

  const { db, username, apiKey } = getOdooServerConfig()
  const uid = await odooJsonRpc<number | false>('common', 'authenticate', [
    db,
    username,
    apiKey,
    {},
  ])

  if (!uid) {
    throw new Error('Odoo authenticate failed — check URL, DB, username, or API key')
  }

  cachedUid = uid
  return uid
}

export async function odooExecuteKw<T>(
  model: string,
  method: string,
  args: unknown[] = [],
  kwargs: Record<string, unknown> = {},
): Promise<T> {
  const { db, apiKey } = getOdooServerConfig()
  const uid = await odooAuthenticate()

  return odooJsonRpc<T>('object', 'execute_kw', [
    db,
    uid,
    apiKey,
    model,
    method,
    args,
    kwargs,
  ])
}

export async function odooHealthCheck() {
  const { url, db } = getOdooServerConfig()
  const version = await odooJsonRpc<Record<string, unknown>>('common', 'version', [])
  const uid = await odooAuthenticate()

  return { url, db, uid, version }
}

const PARTNER_FIELDS = [
  'name',
  'vat',
  'ref',
  'email',
  'is_company',
  'street',
  'street2',
  'city',
  'zip',
  'country_id',
] as const
const ORDER_FIELDS = ['name', 'partner_id', 'state', 'date_order', 'amount_total'] as const
const ORDER_DETAIL_FIELDS = [
  'name',
  'partner_id',
  'state',
  'date_order',
  'amount_total',
  'amount_untaxed',
  'amount_tax',
  'payment_term_id',
  'client_order_ref',
  'commitment_date',
  'currency_id',
] as const
const ORDER_LINE_FIELDS = [
  'product_id',
  'name',
  'product_uom_qty',
  'qty_delivered',
  'qty_invoiced',
  'price_unit',
  'price_subtotal',
  'price_total',
] as const

export async function searchOdooPartners(
  domain: OdooDomain = [],
  limit = 50,
): Promise<OdooPartner[]> {
  return odooExecuteKw<OdooPartner[]>('res.partner', 'search_read', [domain], {
    fields: [...PARTNER_FIELDS],
    limit,
  })
}

export async function searchOdooOrders(
  domain: OdooDomain = [],
  limit = 50,
): Promise<OdooSaleOrder[]> {
  return odooExecuteKw<OdooSaleOrder[]>('sale.order', 'search_read', [domain], {
    fields: [...ORDER_FIELDS],
    limit,
  })
}

export async function readOdooSaleOrderDetail(odooOrderId: number): Promise<{
  order: OdooSaleOrder
  lines: import('./types').OdooSaleOrderLine[]
  partner: OdooPartner | null
}> {
  const orders = await odooExecuteKw<OdooSaleOrder[]>('sale.order', 'search_read', [
    [['id', '=', odooOrderId]],
  ], {
    fields: [...ORDER_DETAIL_FIELDS],
    limit: 1,
  })
  const order = orders[0]
  if (!order) throw new Error(`Sales Order Odoo #${odooOrderId} tidak ditemukan`)

  const lines = await odooExecuteKw<import('./types').OdooSaleOrderLine[]>(
    'sale.order.line',
    'search_read',
    [[['order_id', '=', odooOrderId]]],
    {
      fields: [...ORDER_LINE_FIELDS],
      limit: 200,
      order: 'sequence, id',
    },
  )

  const partnerId = Array.isArray(order.partner_id) ? order.partner_id[0] : order.partner_id
  let partner: OdooPartner | null = null
  if (partnerId) {
    const partners = await searchOdooPartners([['id', '=', partnerId]], 1)
    partner = partners[0] ?? null
  }

  return { order, lines, partner }
}
