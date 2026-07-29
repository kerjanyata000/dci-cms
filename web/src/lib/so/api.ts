import type { SaleOrderRow } from '@/types/cms'

import { cmsFetch } from '@/lib/api/http'

async function parseJson<T>(res: Response): Promise<T> {
  const payload = (await res.json()) as { ok?: boolean; data?: T; error?: string }
  if (!res.ok || !payload.ok) {
    throw new Error(payload.error ?? `Request failed (${res.status})`)
  }
  return payload.data as T
}

export type SyncSoResult = {
  partiesProcessed: number
  ordersUpserted: number
  syncedAt: string
  errors: Array<{ partyId: string; partyCode: string; message: string }>
  failedParties: number
}

export type SyncedOrderRow = SaleOrderRow & {
  parties?: { party_code: string; name: string } | null
}

export type SoHealthSummary = {
  synchronized: number
  noActiveSo: number
  inProgress: number
  quotations: number
  syncErrors: number
}

export async function fetchSyncedOrders(partyId?: string): Promise<{
  orders: SyncedOrderRow[]
  summary: SoHealthSummary | null
}> {
  const qs = partyId ? `?partyId=${encodeURIComponent(partyId)}` : ''
  return parseJson<{ orders: SyncedOrderRow[]; summary: SoHealthSummary | null }>(
    await cmsFetch(`/api/so${qs}`),
  )
}

export async function runSoSync(partyId?: string): Promise<SyncSoResult> {
  return parseJson<SyncSoResult>(
    await cmsFetch('/api/so', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partyId ? { partyId } : {}),
    }),
  )
}

export type SaleOrderDetail = {
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

export async function fetchSaleOrderDetail(orderId: string): Promise<SaleOrderDetail> {
  const data = await parseJson<{ order: SaleOrderDetail }>(
    await cmsFetch(`/api/so/${encodeURIComponent(orderId)}`),
  )
  return data.order
}
