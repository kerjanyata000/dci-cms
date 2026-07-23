import 'server-only'

import { getSupabaseAdmin } from '@/lib/supabase/server'

export async function loadRecentAuditLogs(limit = 50) {
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data ?? []
}
