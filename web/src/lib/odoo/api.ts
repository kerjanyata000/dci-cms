import type { OdooDomain, OdooPartner, OdooSaleOrder } from './types'
import { ODOO_MODE } from './client'
import { dummyOdooClient } from './dummy'

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const payload = (await res.json()) as { ok?: boolean; data?: T; error?: string }
  if (!res.ok || !payload.ok) {
    throw new Error(payload.error ?? `Request failed (${res.status})`)
  }
  return payload.data as T
}

export async function searchPartnersFromApi(
  domain?: OdooDomain,
  limit = 50,
): Promise<OdooPartner[]> {
  if (ODOO_MODE !== 'live') {
    return dummyOdooClient.searchPartners(domain, undefined, limit)
  }
  const data = await postJson<{ partners: OdooPartner[] }>('/api/odoo/partners/search', {
    domain,
    limit,
  })
  return data.partners
}

export async function searchOrdersFromApi(
  domain?: OdooDomain,
  limit = 50,
): Promise<OdooSaleOrder[]> {
  if (ODOO_MODE !== 'live') {
    return dummyOdooClient.searchOrders(domain, undefined, limit)
  }
  const data = await postJson<{ orders: OdooSaleOrder[] }>('/api/odoo/orders/search', {
    domain,
    limit,
  })
  return data.orders
}

export async function checkOdooHealthFromApi() {
  const res = await fetch('/api/odoo/health', { cache: 'no-store' })
  return res.json()
}
