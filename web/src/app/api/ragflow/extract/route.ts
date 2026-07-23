import { jsonError, jsonOk } from '@/lib/server/api-route'
import {
  extractRagflowMetadata,
  runRagflowExtractionPipeline,
} from '@/lib/ragflow/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') ?? ''

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      const file = form.get('file')
      const datasetId = String(form.get('datasetId') ?? '') || undefined

      if (!(file instanceof File)) {
        return jsonError('file is required', 400)
      }

      const data = await runRagflowExtractionPipeline(file, file.name, datasetId)
      return jsonOk(data)
    }

    const body = (await request.json()) as { docId?: string; datasetId?: string }
    if (!body.docId) {
      return jsonError('docId is required', 400)
    }

    const result = await extractRagflowMetadata(body.docId, body.datasetId)
    return jsonOk({ result })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'RAGFlow extract failed', 500)
  }
}
