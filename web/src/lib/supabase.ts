import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

/** Browser client — only anon key. Service role stays on Route Handlers / server. */
export const supabase = isSupabaseConfigured
  ? createClient(url!, anonKey!)
  : null
