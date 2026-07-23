import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { CMS_SESSION_COOKIE, decodeSessionCookie } from '@/lib/auth/session-cookie'
import { ROLES } from '@/lib/roles'

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/parties',
  '/renewal',
  '/so',
  '/search',
  '/activity',
  '/lab',
]

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

  const raw = request.cookies.get(CMS_SESSION_COOKIE)?.value
  const payload = raw ? decodeSessionCookie(raw) : null
  const valid = payload?.role && payload.role in ROLES

  if (!valid) {
    const loginUrl = new URL('/', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
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
    '/lab/:path*',
  ],
}
