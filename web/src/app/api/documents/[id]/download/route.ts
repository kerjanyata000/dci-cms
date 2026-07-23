import { jsonError, jsonOk } from '@/lib/server/api-route'
import { getDocumentDownloadUrl } from '@/lib/documents/server'

export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const download = await getDocumentDownloadUrl(id)
    return jsonOk(download)
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Download failed', 404)
  }
}
