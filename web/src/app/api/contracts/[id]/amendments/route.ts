import { jsonError, jsonOk } from '@/lib/server/api-route'
import { createAmendment } from '@/lib/contracts/server'

export const runtime = 'nodejs'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: parentContractId } = await context.params
    const body = (await request.json()) as {
      title?: string
      change_category?: string
      effective_date?: string
      reason?: string
      summary?: string
      doc_type?: string
    }

    if (!body.title?.trim()) return jsonError('title is required', 400)

    const amendment = await createAmendment(parentContractId, {
      title: body.title.trim(),
      change_category: body.change_category,
      effective_date: body.effective_date,
      reason: body.reason,
      summary: body.summary,
      doc_type: body.doc_type,
    })
    return jsonOk({ amendment }, { status: 201 })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Failed to create amendment', 500)
  }
}
