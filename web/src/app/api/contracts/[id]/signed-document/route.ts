import { jsonError, jsonOk } from '@/lib/server/api-route'
import { persistSignedContractDocument } from '@/lib/documents/server'
import { getContractById, transitionContractStatus } from '@/lib/contracts/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: contractId } = await context.params
    const form = await request.formData()
    const file = form.get('file')
    const markFullySigned = form.get('mark_fully_signed') === '1'

    if (!(file instanceof File)) {
      return jsonError('file is required', 400)
    }

    const contract = await getContractById(contractId)
    const doc = await persistSignedContractDocument({
      partyId: contract.party_id,
      contractId,
      file,
    })

    const db = getSupabaseAdmin()
    await db.from('audit_logs').insert({
      action: `Signed document uploaded — ${file.name} [${contract.contract_code}]`,
      action_type: 'upload',
      party_id: contract.party_id,
      contract_id: contractId,
      actor_name: 'CMS',
      payload: { file_name: file.name, document_id: doc.id },
    })

    let updatedContract = contract
    if (markFullySigned) {
      updatedContract = await transitionContractStatus(contractId, 'mark_fully_signed')
    }

    return jsonOk({ document: doc, contract: updatedContract }, { status: 201 })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Upload failed', 500)
  }
}
