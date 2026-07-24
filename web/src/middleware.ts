import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { CMS_SESSION_COOKIE, decodeSessionCookie } from '@/lib/auth/session-cookie'
import { ROLES, canAccessRoute, type AppRole } from '@/lib/roles'

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/parties',
  '/renewal',
  '/so',
  '/search',
  '/activity',
  '/notifications',
  '/lab',
]

function sessionRole(raw: string | undefined): AppRole | null {
  if (!raw) return null
  const payload = decodeSessionCookie(raw)
  if (!payload?.role || !(payload.role in ROLES)) return null
  return payload.role as AppRole
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )

  if (!isProtected) {
    return NextResponse.next()
  }

  const role = sessionRole(request.cookies.get(CMS_SESSION_COOKIE)?.value)

  if (!role) {
    const loginUrl = new URL('/', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (!canAccessRoute(role, pathname)) {
    const denied = new URL('/dashboard', request.url)
    denied.searchParams.set('forbidden', pathname)
    return NextResponse.redirect(denied)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/parties/:path*',
    '/renewal/:path*',
    '/so/:path*',
    '/search/:path*',
    '/activity/:path*',
    '/notifications/:path*',
    '/lab/:path*',
  ],
}
