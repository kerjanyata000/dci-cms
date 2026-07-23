import 'server-only'

import { authErrorResponse, requireCanEdit } from '@/lib/auth/guard'
import { jsonError } from '@/lib/server/api-route'

/** Wrap mutating route handlers with Legal/edit RBAC. */
export async function withCanEdit<T>(
  request: Request,
  handler: () => Promise<T>,
): Promise<T | Response> {
  try {
    await requireCanEdit(request)
    return await handler()
  } catch (err) {
    const auth = authErrorResponse(err)
    if (auth) return auth
    throw err
  }
}

export { authErrorResponse, requireActor, requireCanEdit, requireCanSync, requireAuditAccess } from '@/lib/auth/guard'

export function handleRouteError(err: unknown, fallback: string) {
  const auth = authErrorResponse(err)
  if (auth) return auth
  return jsonError(err instanceof Error ? err.message : fallback, 500)
}
