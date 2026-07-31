import { requireCanEdit, handleRouteError } from '@/lib/auth/route-helpers'
import { jsonError, jsonOk } from '@/lib/server/api-route'
import { previewContractAiIntake } from '@/lib/contracts/ai-intake-server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    await requireCanEdit(request)
    const contentType = request.headers.get('content-type') ?? ''
    if (!contentType.includes('multipart/form-data')) {
      return jsonError('multipart/form-data required', 400)
    }

    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return jsonError('file is required', 400)
    }

    const partyId = String(form.get('partyId') ?? '') || null
    const preview = await previewContractAiIntake({ file, partyId })
    return jsonOk(preview)
  } catch (err) {
    return handleRouteError(err, 'AI preview gagal')
  }
}
