import 'server-only'

import { jsonError } from '@/lib/server/api-route'
import {
  actorCanEdit,
  actorCanSync,
  actorCanViewAudit,
  getRequestActor,
  type RequestActor,
} from '@/lib/auth/server'

export class ApiAuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function requireActor(request: Request): Promise<RequestActor> {
  const actor = await getRequestActor(request)
  if (!actor) {
    throw new ApiAuthError('Unauthorized — login required', 401)
  }
  return actor
}

export async function requireCanEdit(request: Request): Promise<RequestActor> {
  const actor = await requireActor(request)
  if (!actorCanEdit(actor)) {
    throw new ApiAuthError('Forbidden — role view-only (BRL-CMS-001)', 403)
  }
  return actor
}

export async function requireCanSync(request: Request): Promise<RequestActor> {
  const actor = await requireActor(request)
  if (!actorCanSync(actor)) {
    throw new ApiAuthError('Forbidden — SO sync not allowed for this role', 403)
  }
  return actor
}

export async function requireAuditAccess(request: Request): Promise<RequestActor> {
  const actor = await requireActor(request)
  if (!actorCanViewAudit(actor)) {
    throw new ApiAuthError('Forbidden — audit access denied', 403)
  }
  return actor
}

export function authErrorResponse(err: unknown) {
  if (err instanceof ApiAuthError) {
    return jsonError(err.message, err.status)
  }
  return null
}
