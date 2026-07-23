import { jsonError, jsonOk } from '@/lib/server/api-route'
import { ragflowHealthCheck } from '@/lib/ragflow/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const data = await ragflowHealthCheck()
    return jsonOk(data)
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'RAGFlow health check failed', 500)
  }
}
