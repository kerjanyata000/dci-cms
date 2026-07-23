import { requireCanEdit, handleRouteError } from '@/lib/auth/route-helpers'
import { jsonOk } from '@/lib/server/api-route'
import { createPartyContract, type CreateContractInput } from '@/lib/contracts/server'

export const runtime = 'nodejs'

function parseCreateBody(form: FormData) {
  const durationRaw = String(form.get('duration_months') ?? '')
  const duration_months = durationRaw ? Number.parseInt(durationRaw, 10) : undefined

  return {
    contract_title: String(form.get('contract_title') ?? ''),
    doc_type: String(form.get('doc_type') ?? '') || undefined,
    agreement_no: String(form.get('agreement_no') ?? '') || undefined,
    agreement_date: String(form.get('agreement_date') ?? '') || undefined,
    duration_months: Number.isFinite(duration_months) ? duration_months : undefined,
    contract_value: String(form.get('contract_value') ?? '') || undefined,
    owner: String(form.get('owner') ?? '') || undefined,
    department: String(form.get('department') ?? '') || undefined,
    remarks: String(form.get('remarks') ?? '') || undefined,
    save_mode: (String(form.get('save_mode') ?? 'draft') as 'draft' | 'review') || 'draft',
    file: form.get('file') instanceof File ? (form.get('file') as File) : null,
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireCanEdit(request)
    const { id: partyId } = await context.params
    const contentType = request.headers.get('content-type') ?? ''

    let body: CreateContractInput
    if (contentType.includes('multipart/form-data')) {
      body = parseCreateBody(await request.formData())
    } else {
      body = { ...(await request.json()), file: null } as CreateContractInput
    }

    const contract = await createPartyContract(partyId, body)
    return jsonOk({ contract }, { status: 201 })
  } catch (err) {
    return handleRouteError(err, 'Failed to create contract')
  }
}
