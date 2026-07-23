import { jsonError, jsonOk } from '@/lib/server/api-route'
import { retrieveRagflowChunks } from '@/lib/ragflow/server'

export const runtime = 'nodejs'

type Body = {
  query?: string
  datasetId?: string
  topK?: number
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body
    if (!body.query?.trim()) {
      return jsonError('query is required', 400)
    }

    const hits = await retrieveRagflowChunks(
      body.query.trim(),
      body.datasetId,
      body.topK ?? 5,
    )
    return jsonOk({ hits })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'RAGFlow retrieve failed', 500)
  }
}
