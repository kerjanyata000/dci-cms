import { jsonError, jsonOk } from '@/lib/server/api-route'
import { loadRecentAuditLogs } from '@/lib/audit/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const logs = await loadRecentAuditLogs(80)
    return jsonOk({ logs })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Audit load failed', 500)
  }
}
