import type { AuthMode } from '@/lib/auth/mode-types'

export type { AuthMode } from '@/lib/auth/mode-types'

function looksConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ''
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? ''
  if (!url || !anon) return false
  if (url.includes('YOUR_PROJECT') || anon === 'your-anon-key') return false
  return true
}

/**
 * FR-DASH-001 / S4 — default **supabase** (email/password + profiles.role).
 * Opt into prototype role picker with `NEXT_PUBLIC_AUTH_MODE=mock`.
 * If supabase keys are missing/placeholder, fall back to mock so local still boots.
 */
export function resolveAuthMode(): AuthMode {
  const explicit = process.env.NEXT_PUBLIC_AUTH_MODE?.trim().toLowerCase()
  if (explicit === 'mock') return 'mock'
  if (explicit === 'supabase') return looksConfigured() ? 'supabase' : 'mock'
  // unset → prefer supabase when configured
  return looksConfigured() ? 'supabase' : 'mock'
}

export const AUTH_MODE: AuthMode = resolveAuthMode()
