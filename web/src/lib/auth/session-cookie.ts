export const CMS_SESSION_COOKIE = 'cms_session'

export type SessionCookiePayload = {
  name: string
  role: string
}

export function encodeSessionCookie(payload: SessionCookiePayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
}

export function decodeSessionCookie(value: string): SessionCookiePayload | null {
  try {
    const json = Buffer.from(value, 'base64url').toString('utf8')
    const parsed = JSON.parse(json) as SessionCookiePayload
    if (!parsed.name || !parsed.role) return null
    return parsed
  } catch {
    return null
  }
}

export function sessionCookieOptions(maxAgeSec = 60 * 60 * 24 * 7) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSec,
  }
}
