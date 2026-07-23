import { requireActor, handleRouteError } from '@/lib/auth/route-helpers'
import { jsonOk } from '@/lib/server/api-route'
import { runSmartSearch, type SearchScope } from '@/lib/search/server'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    await requireActor(request)
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') ?? ''
    const scope = (searchParams.get('scope') as SearchScope | null) ?? 'all'
    const status = searchParams.get('status') ?? undefined
    const docType = searchParams.get('docType') ?? undefined
    const semantic = searchParams.get('semantic') !== '0'

    const result = await runSmartSearch({ q, scope, status, docType, semantic })
    return jsonOk(result)
  } catch (err) {
    return handleRouteError(err, 'Search failed')
  }
}
