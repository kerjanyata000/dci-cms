import 'server-only'

import { getSupabaseAdmin } from '@/lib/supabase/server'

export type AuditLogRow = {
  id: string
  action: string
  action_type: string | null
  actor_name: string | null
  party_id: string | null
  party_code: string | null
  created_at: string
}

function unwrapPartyCode(raw: unknown): string | null {
  if (!raw) return null
  if (Array.isArray(raw)) {
    const row = raw[0] as { party_code?: string } | undefined
    return row?.party_code ?? null
  }
  const row = raw as { party_code?: string }
  return row.party_code ?? null
}

export async function loadRecentAuditLogs(limit = 50): Promise<AuditLogRow[]> {
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('audit_logs')
    .select('id, action, action_type, actor_name, party_id, created_at, parties(party_code)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({
    id: row.id,
    action: row.action,
    action_type: row.action_type,
    actor_name: row.actor_name,
    party_id: row.party_id,
    party_code: unwrapPartyCode(row.parties),
    created_at: row.created_at,
  }))
}
