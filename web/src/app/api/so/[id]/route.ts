import { authErrorResponse, requireActor } from '@/lib/auth/guard'
import { jsonError, jsonOk } from '@/lib/server/api-route'
import { getSaleOrderDetail } from '@/lib/so/server'

export const runtime = 'nodejs'

type Ctx = { params: Promise<{ id: string }> }

/** Detail SO/Quotation — view-only (consume dari Odoo / mirror). */
export async function GET(_request: Request, ctx: Ctx) {
  try {
    await requireActor(_request)
    const { id } = await ctx.params
    if (!id) return jsonError('id required', 400)
    const detail = await getSaleOrderDetail(id)
    return jsonOk({ order: detail })
  } catch (err) {
    const auth = authErrorResponse(err)
    if (auth) return auth
    return jsonError(err instanceof Error ? err.message : 'Failed to load SO detail', 500)
  }
}
