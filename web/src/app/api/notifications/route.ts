import { requireActor, handleRouteError } from '@/lib/auth/route-helpers'
import { jsonOk } from '@/lib/server/api-route'
import { loadNotifications } from '@/lib/notifications/server'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    await requireActor(request)
    return jsonOk({ notifications: await loadNotifications() })
  } catch (err) {
    return handleRouteError(err, 'Notifications failed')
  }
}
