import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { AUTH_MODE } from '@/lib/auth/mode'
import {
  CMS_SESSION_COOKIE,
  decodeSessionCookie,
  encodeSessionCookie,
  sessionCookieOptions,
  type SessionCookiePayload,
} from '@/lib/auth/session-cookie'
import { ROLES, type AppRole, type SessionUser } from '@/lib/roles'
import { jsonError, jsonOk } from '@/lib/server/api-route'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function isAppRole(value: string): value is AppRole {
  return value in ROLES
}

async function userFromAccessToken(accessToken: string): Promise<SessionUser | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return null

  const supabase = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await supabase.auth.getUser(accessToken)
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
    name: profile?.full_name?.trim() || fallbackName,
    role,
  }
}

function setSessionCookie(response: NextResponse, user: SessionUser) {
  const payload: SessionCookiePayload = { name: user.name, role: user.role }
  response.cookies.set(CMS_SESSION_COOKIE, encodeSessionCookie(payload), sessionCookieOptions())
}

export async function GET() {
  const jar = await cookies()
  const raw = jar.get(CMS_SESSION_COOKIE)?.value
  if (!raw) return jsonOk({ user: null })

  const payload = decodeSessionCookie(raw)
  if (!payload || !isAppRole(payload.role)) {
    return jsonOk({ user: null })
  }

  return jsonOk({ user: { name: payload.name, role: payload.role } satisfies SessionUser })
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      user?: SessionUser
      accessToken?: string
    }

    let user: SessionUser | null = null

    if (AUTH_MODE === 'supabase' && body.accessToken) {
      user = await userFromAccessToken(body.accessToken)
      if (!user) return jsonError('Invalid Supabase session', 401)
    } else if (AUTH_MODE === 'mock' && body.user?.name && body.user?.role) {
      if (!isAppRole(body.user.role)) return jsonError('Invalid role', 400)
      user = { name: body.user.name, role: body.user.role }
    } else {
      return jsonError('Invalid session payload', 400)
    }

    const response = jsonOk({ user })
    setSessionCookie(response, user)
    return response
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Session failed', 500)
  }
}

export async function DELETE() {
  const response = jsonOk({ ok: true })
  response.cookies.set(CMS_SESSION_COOKIE, '', { ...sessionCookieOptions(0), maxAge: 0 })
  return response
}
