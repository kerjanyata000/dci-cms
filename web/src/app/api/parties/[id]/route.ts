import { requireActor, handleRouteError } from '@/lib/auth/route-helpers'
import { jsonError, jsonOk } from '@/lib/server/api-route'
import {
  mapAmendmentRow,
  mapCounterpartyChangeRow,
  mapTerminationRow,
  type AmendmentRow,
  type CounterpartyChangeRow,
  type TerminationRow,
} from '@/lib/contracts/server'
import { mapContractRow, type ContractRow } from '@/lib/contracts/types'
import { mapPartyRow, type PartyRow } from '@/lib/parties/types'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const ACTIVE_CONTRACT = ['active', 'fully_signed', 'signed']
const ACTIVE_SO = ['sale', 'done']

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireActor(request)
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

    const [contractsRes, documentsRes, auditRes, amendmentsRes, terminationsRes, soRes, cpChangesRes] =
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
        db
          .from('contract_counterparty_changes')
          .select('*')
          .or(`from_party_id.eq.${id},to_party_id.eq.${id}`)
          .order('created_at', { ascending: false }),
      ])

    if (contractsRes.error) throw new Error(contractsRes.error.message)
    if (documentsRes.error) throw new Error(documentsRes.error.message)
    if (auditRes.error) throw new Error(auditRes.error.message)
    if (amendmentsRes.error) throw new Error(amendmentsRes.error.message)
    if (terminationsRes.error) throw new Error(terminationsRes.error.message)
    if (soRes.error) throw new Error(soRes.error.message)
    if (cpChangesRes.error) throw new Error(cpChangesRes.error.message)

    const contracts = (contractsRes.data ?? []).map((c) => mapContractRow(c as ContractRow))
    const partyMap = new Map([[id, party as PartyRow]])

    const { data: relatedParties } = await db
      .from('parties')
      .select('id, party_code, name')
      .in(
        'id',
        [
          ...new Set(
            (cpChangesRes.data ?? []).flatMap((c) => [c.from_party_id, c.to_party_id]),
          ),
        ].filter(Boolean),
      )

    for (const p of relatedParties ?? []) {
      partyMap.set(p.id, p as PartyRow)
    }

    const contractMap = new Map(contracts.map((c) => [c.id, c]))

    const counterpartyChanges = (cpChangesRes.data ?? []).map((row) => {
      const change = mapCounterpartyChangeRow(row as CounterpartyChangeRow)
      const fromP = partyMap.get(change.from_party_id)
      const toP = partyMap.get(change.to_party_id)
      const contract = contractMap.get(change.contract_id)
      return {
        ...change,
        from_party_code: fromP?.party_code,
        from_party_name: fromP?.name,
        to_party_code: toP?.party_code,
        to_party_name: toP?.name,
        contract_code: contract?.contract_code,
      }
    })
    const hasActiveContract = contracts.some((c) => ACTIVE_CONTRACT.includes(c.status))
    const hasActiveSo = (soRes.data ?? []).some((o) => ACTIVE_SO.includes(String(o.state)))

    return jsonOk({
      party: mapPartyRow(party as PartyRow),
      contracts,
      documents: documentsRes.data ?? [],
      amendments: (amendmentsRes.data ?? []).map((a) => mapAmendmentRow(a as AmendmentRow)),
      terminations: (terminationsRes.data ?? []).map((t) => mapTerminationRow(t as TerminationRow)),
      counterpartyChanges,
      auditLogs: auditRes.data ?? [],
      soHealth: {
        hasActiveContract,
        hasActiveSo,
        noActiveSo: hasActiveContract && !hasActiveSo,
      },
    })
  } catch (err) {
    return handleRouteError(err, 'Failed to load party')
  }
}
