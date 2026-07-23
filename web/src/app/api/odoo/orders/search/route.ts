import { jsonError, jsonOk } from '@/lib/server/api-route'
import { searchOdooOrders } from '@/lib/odoo/server'
import type { OdooDomain } from '@/lib/odoo/types'

export const runtime = 'nodejs'

type Body = {
  domain?: OdooDomain
  limit?: number
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body
    const orders = await searchOdooOrders(body.domain ?? [], body.limit ?? 50)
    return jsonOk({ orders })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Order search failed', 500)
  }
}
