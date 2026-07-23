import 'server-only'

import { AUTH_MODE } from '@/lib/auth/mode'
import { decodeSessionCookie, CMS_SESSION_COOKIE } from '@/lib/auth/session-cookie'
import { ROLES, type AppRole, type SessionUser } from '@/lib/roles'
import { createClient } from '@supabase/supabase-js'

export type RequestActor = SessionUser & {
  userId?: string
  source: 'cookie' | 'bearer'
}

function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {}
  return Object.fromEntries(
    header.split(';').map((part) => {
      const i = part.indexOf('=')
      if (i < 0) return [part.trim(), '']
      return [part.slice(0, i).trim(), decodeURIComponent(part.slice(i + 1).trim())]
    }),
  )
}

function isAppRole(value: string): value is AppRole {
  return value in ROLES
}

async function actorFromBearer(token: string): Promise<RequestActor | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return null

  const supabase = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', data.user.id)
    .maybeSingle()

  const role = isAppRole(String(profile?.role ?? 'business'))
    ? (profile!.role as AppRole)
    : 'business'

  const email = data.user.email ?? ''
  const fallbackName = email
    .split('@')[0]
    .replace(/[.\-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

  return {
    userId: data.user.id,
    name: profile?.full_name?.trim() || fallbackName,
    role,
    source: 'bearer',
  }
}

export async function getRequestActor(request: Request): Promise<RequestActor | null> {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const actor = await actorFromBearer(authHeader.slice(7))
    if (actor) return actor
  }

  const cookies = parseCookies(request.headers.get('cookie'))
  const raw = cookies[CMS_SESSION_COOKIE]
  if (raw) {
    const payload = decodeSessionCookie(raw)
    if (payload && isAppRole(payload.role)) {
      return { name: payload.name, role: payload.role, source: 'cookie' }
    }
  }

  if (AUTH_MODE === 'mock' && process.env.NODE_ENV !== 'production') {
    const devRole = request.headers.get('x-cms-role')
    if (devRole && isAppRole(devRole)) {
      return { name: 'Dev User', role: devRole, source: 'cookie' }
    }
  }

  return null
}

export function actorCanEdit(actor: RequestActor): boolean {
  return ROLES[actor.role].canEdit
}

export function actorCanSync(actor: RequestActor): boolean {
  return ROLES[actor.role].canSync || ROLES[actor.role].canEdit
}

export function actorCanViewAudit(actor: RequestActor): boolean {
  return ROLES[actor.role].views.includes('audit')
}
