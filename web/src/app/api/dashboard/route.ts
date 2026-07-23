import { requireActor, handleRouteError } from '@/lib/auth/route-helpers'
import { jsonOk } from '@/lib/server/api-route'
import { loadDashboardPayload } from '@/lib/dashboard/server'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    await requireActor(request)
    const data = await loadDashboardPayload()
    return jsonOk(data)
  } catch (err) {
    return handleRouteError(err, 'Dashboard load failed')
  }
}
