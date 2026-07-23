import { jsonError, jsonOk } from '@/lib/server/api-route'
import { persistSupportingDocument } from '@/lib/documents/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: partyId } = await context.params
    const form = await request.formData()
    const file = form.get('file')
    const description = String(form.get('description') ?? '') || undefined
    const contractId = String(form.get('contract_id') ?? '') || undefined
    const category = (String(form.get('category') ?? 'supporting') ||
      'supporting') as 'supporting' | 'termination' | 'amendment'

    if (!(file instanceof File)) {
      return jsonError('file is required', 400)
    }

    const db = getSupabaseAdmin()
    const { data: party } = await db.from('parties').select('id').eq('id', partyId).single()
    if (!party) return jsonError('Party not found', 404)

    const doc = await persistSupportingDocument({
      partyId,
      contractId: contractId || null,
      file,
      description,
      category,
    })

    await db.from('audit_logs').insert({
      action: `Supporting document uploaded — ${file.name}`,
      action_type: 'upload',
      party_id: partyId,
      contract_id: contractId || null,
      actor_name: 'CMS',
      payload: { file_name: file.name, category },
    })

    return jsonOk({ document: doc }, { status: 201 })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Upload failed', 500)
  }
}
