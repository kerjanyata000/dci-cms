import { jsonError, jsonOk } from '@/lib/server/api-route'
import { mapPartyRow, type PartyRow } from '@/lib/parties/types'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const db = getSupabaseAdmin()

    const { data: party, error: partyError } = await db
      .from('parties')
      .select('*')
      .eq('id', id)
      .single()

    if (partyError || !party) {
      return jsonError('Party not found', 404)
    }

    const [contractsRes, documentsRes, auditRes] = await Promise.all([
      db
        .from('contracts')
        .select('*')
        .eq('party_id', id)
        .order('created_at', { ascending: false }),
      db
        .from('documents')
        .select('*')
        .eq('party_id', id)
        .order('created_at', { ascending: false }),
      db
        .from('audit_logs')
        .select('*')
        .eq('party_id', id)
        .order('created_at', { ascending: false })
        .limit(50),
    ])

    if (contractsRes.error) throw new Error(contractsRes.error.message)
    if (documentsRes.error) throw new Error(documentsRes.error.message)
    if (auditRes.error) throw new Error(auditRes.error.message)

    return jsonOk({
      party: mapPartyRow(party as PartyRow),
      contracts: contractsRes.data ?? [],
      documents: documentsRes.data ?? [],
      auditLogs: auditRes.data ?? [],
    })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Failed to load party', 500)
  }
}
