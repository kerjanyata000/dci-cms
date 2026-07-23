import { jsonError, jsonOk } from '@/lib/server/api-route'
import { listSyncedSaleOrders, syncSaleOrdersFromOdoo } from '@/lib/so/server'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const partyId = new URL(request.url).searchParams.get('partyId') ?? undefined
    const rows = await listSyncedSaleOrders(partyId)
    return jsonOk({ orders: rows })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Failed to list SO', 500)
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { partyId?: string }
    const result = await syncSaleOrdersFromOdoo(body.partyId)
    return jsonOk(result)
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'SO sync failed', 500)
  }
}
