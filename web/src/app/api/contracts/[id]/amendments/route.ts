import { requireCanEdit, handleRouteError } from '@/lib/auth/route-helpers'
import { jsonError, jsonOk } from '@/lib/server/api-route'
import { createAmendment, transitionAmendmentStatus } from '@/lib/contracts/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireCanEdit(request)
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
    return handleRouteError(err, 'Failed to create amendment')
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireCanEdit(request)
    const { id: parentContractId } = await context.params
    const body = (await request.json()) as {
      action?: 'status'
      amendmentId?: string
      statusAction?: string
    }

    if (body.action !== 'status' || !body.amendmentId || !body.statusAction) {
      return jsonError('action=status, amendmentId, and statusAction required', 400)
    }

    const db = getSupabaseAdmin()
    const { data: row, error } = await db
      .from('contract_amendments')
      .select('id, parent_contract_id')
      .eq('id', body.amendmentId)
      .single()

    if (error || !row) return jsonError('Amendment not found', 404)
    if (row.parent_contract_id !== parentContractId) {
      return jsonError('Amendment does not belong to this contract', 400)
    }

    const amendment = await transitionAmendmentStatus(body.amendmentId, body.statusAction)
    return jsonOk({ amendment })
  } catch (err) {
    return handleRouteError(err, 'Failed to update amendment status')
  }
}
