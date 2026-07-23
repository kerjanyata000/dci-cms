import { jsonError, jsonOk } from '@/lib/server/api-route'
import { odooHealthCheck } from '@/lib/odoo/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const data = await odooHealthCheck()
    return jsonOk(data)
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Odoo health check failed', 500)
  }
}
