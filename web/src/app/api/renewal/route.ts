import { requireActor, handleRouteError } from '@/lib/auth/route-helpers'
import { jsonOk } from '@/lib/server/api-route'
import { loadRenewalAgenda, summarizeRenewal } from '@/lib/renewal/server'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    await requireActor(request)
    const items = await loadRenewalAgenda()
    return jsonOk({ items, summary: summarizeRenewal(items) })
  } catch (err) {
    return handleRouteError(err, 'Renewal load failed')
  }
}
