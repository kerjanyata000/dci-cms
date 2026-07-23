import { jsonError, jsonOk } from '@/lib/server/api-route'
import { loadRenewalAgenda, summarizeRenewal } from '@/lib/renewal/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const items = await loadRenewalAgenda()
    return jsonOk({ items, summary: summarizeRenewal(items) })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Renewal load failed', 500)
  }
}
