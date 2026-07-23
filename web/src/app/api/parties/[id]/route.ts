import { jsonError, jsonOk } from '@/lib/server/api-route'
import { mapAmendmentRow, mapTerminationRow, type AmendmentRow, type TerminationRow } from '@/lib/contracts/server'
import { mapContractRow, type ContractRow } from '@/lib/contracts/types'
import { mapPartyRow, type PartyRow } from '@/lib/parties/types'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const ACTIVE_CONTRACT = ['active', 'fully_signed', 'signed']
const ACTIVE_SO = ['sale', 'done']

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

    const [contractsRes, documentsRes, auditRes, amendmentsRes, terminationsRes, soRes] =
      await Promise.all([
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
        db
          .from('contract_amendments')
          .select('*')
          .eq('party_id', id)
          .order('created_at', { ascending: false }),
        db
          .from('contract_terminations')
          .select('*')
          .eq('party_id', id)
          .order('created_at', { ascending: false }),
        db.from('sale_orders').select('state').eq('party_id', id),
      ])

    if (contractsRes.error) throw new Error(contractsRes.error.message)
    if (documentsRes.error) throw new Error(documentsRes.error.message)
    if (auditRes.error) throw new Error(auditRes.error.message)
    if (amendmentsRes.error) throw new Error(amendmentsRes.error.message)
    if (terminationsRes.error) throw new Error(terminationsRes.error.message)
    if (soRes.error) throw new Error(soRes.error.message)

    const contracts = (contractsRes.data ?? []).map((c) => mapContractRow(c as ContractRow))
    const hasActiveContract = contracts.some((c) => ACTIVE_CONTRACT.includes(c.status))
    const hasActiveSo = (soRes.data ?? []).some((o) => ACTIVE_SO.includes(String(o.state)))

    return jsonOk({
      party: mapPartyRow(party as PartyRow),
      contracts,
      documents: documentsRes.data ?? [],
      amendments: (amendmentsRes.data ?? []).map((a) => mapAmendmentRow(a as AmendmentRow)),
      terminations: (terminationsRes.data ?? []).map((t) => mapTerminationRow(t as TerminationRow)),
      auditLogs: auditRes.data ?? [],
      soHealth: {
        hasActiveContract,
        hasActiveSo,
        noActiveSo: hasActiveContract && !hasActiveSo,
      },
    })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Failed to load party', 500)
  }
}
