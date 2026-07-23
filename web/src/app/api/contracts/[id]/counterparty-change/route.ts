import { jsonError, jsonOk } from '@/lib/server/api-route'
import { changeContractCounterparty } from '@/lib/contracts/server'

export const runtime = 'nodejs'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const body = (await request.json()) as {
      to_party_id?: string
      change_type?: string
      effective_date?: string
      reason?: string
    }

    if (!body.to_party_id) return jsonError('to_party_id is required', 400)

    const result = await changeContractCounterparty(id, {
      to_party_id: body.to_party_id,
      change_type: body.change_type ?? 'Other',
      effective_date: body.effective_date,
      reason: body.reason ?? '',
    })

    return jsonOk(result)
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Counterparty change failed', 500)
  }
}
