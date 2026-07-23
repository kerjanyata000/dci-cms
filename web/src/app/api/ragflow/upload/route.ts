import { jsonError, jsonOk } from '@/lib/server/api-route'
import { uploadRagflowDocument } from '@/lib/ragflow/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const file = form.get('file')
    const datasetId = String(form.get('datasetId') ?? '')

    if (!(file instanceof File)) {
      return jsonError('file is required', 400)
    }

    const result = await uploadRagflowDocument(file, file.name, datasetId || undefined)
    return jsonOk(result)
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'RAGFlow upload failed', 500)
  }
}
