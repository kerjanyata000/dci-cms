import { authErrorResponse, requireAuditAccess } from '@/lib/auth/guard'
import { jsonError, jsonOk } from '@/lib/server/api-route'
import { loadRecentAuditLogs } from '@/lib/audit/server'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    await requireAuditAccess(request)
    const logs = await loadRecentAuditLogs(80)
    return jsonOk({ logs })
  } catch (err) {
    const auth = authErrorResponse(err)
    if (auth) return auth
    return jsonError(err instanceof Error ? err.message : 'Audit load failed', 500)
  }
}
