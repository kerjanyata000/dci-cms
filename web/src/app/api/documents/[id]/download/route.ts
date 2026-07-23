import { requireActor, handleRouteError } from '@/lib/auth/route-helpers'
import { jsonOk } from '@/lib/server/api-route'
import { getDocumentDownloadUrl } from '@/lib/documents/server'

export const runtime = 'nodejs'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireActor(request)
    const { id } = await context.params
    const download = await getDocumentDownloadUrl(id)
    return jsonOk(download)
  } catch (err) {
    return handleRouteError(err, 'Download failed')
  }
}
