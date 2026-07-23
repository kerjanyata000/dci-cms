import { jsonError, jsonOk } from '@/lib/server/api-route'
import { retrieveRagflowChunks } from '@/lib/ragflow/server'

export const runtime = 'nodejs'

type Body = {
  query?: string
  datasetId?: string
  topK?: number
  cmsOnly?: boolean
  documentIds?: string[]
  similarityThreshold?: number
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body
    if (!body.query?.trim()) {
      return jsonError('query is required', 400)
    }

    const hits = await retrieveRagflowChunks(body.query.trim(), {
      datasetId: body.datasetId,
      topK: body.topK ?? 5,
      cmsOnly: body.cmsOnly,
      documentIds: body.documentIds,
      similarityThreshold: body.similarityThreshold,
    })
    return jsonOk({ hits })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'RAGFlow retrieve failed', 500)
  }
}
