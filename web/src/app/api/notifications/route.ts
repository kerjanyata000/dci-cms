import { jsonError, jsonOk } from '@/lib/server/api-route'
import { loadNotifications } from '@/lib/notifications/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    return jsonOk({ notifications: await loadNotifications() })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Notifications failed', 500)
  }
}
