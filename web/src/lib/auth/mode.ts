export type AuthMode = 'mock' | 'supabase'

/** mock = dev role picker; supabase = email/password + profiles.role */
export const AUTH_MODE: AuthMode =
  process.env.NEXT_PUBLIC_AUTH_MODE === 'supabase' ? 'supabase' : 'mock'
