import { jsonError, jsonOk } from '@/lib/server/api-route'
import { loadDashboardPayload } from '@/lib/dashboard/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const data = await loadDashboardPayload()
    return jsonOk(data)
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Dashboard load failed', 500)
  }
}
