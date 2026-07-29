import { authErrorResponse, requireActor } from '@/lib/auth/guard'
import { findDuplicateParties } from '@/lib/parties/server'
import { jsonError, jsonOk } from '@/lib/server/api-route'

export const runtime = 'nodejs'

/** FR-PTY-ADD-004 — preview duplikat sebelum create/edit. */
export async function GET(request: Request) {
  try {
    await requireActor(request)
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')?.trim() ?? ''
    const npwp = searchParams.get('npwp')?.trim() || null
    const excludeId = searchParams.get('excludeId')?.trim() || undefined

    if (!name && !npwp) {
      return jsonOk({ duplicates: [] as Awaited<ReturnType<typeof findDuplicateParties>> })
    }

    const duplicates = await findDuplicateParties({ name, npwp, excludeId })
    return jsonOk({ duplicates })
  } catch (err) {
    const auth = authErrorResponse(err)
    if (auth) return auth
    return jsonError(err instanceof Error ? err.message : 'Failed to check duplicates', 500)
  }
}
