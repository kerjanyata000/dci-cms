import { requireCanEdit, handleRouteError } from '@/lib/auth/route-helpers'
import { jsonOk } from '@/lib/server/api-route'
import { createEarlyTermination } from '@/lib/contracts/server'

export const runtime = 'nodejs'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireCanEdit(request)
    const { id: contractId } = await context.params
    const body = (await request.json()) as {
      termination_type?: string
      effective_date?: string
      reason?: string
      summary?: string
    }

    const termination = await createEarlyTermination(contractId, {
      termination_type: body.termination_type,
      effective_date: body.effective_date ?? '',
      reason: body.reason,
      summary: body.summary,
    })

    return jsonOk({ termination }, { status: 201 })
  } catch (err) {
    return handleRouteError(err, 'Failed to create termination')
  }
}
