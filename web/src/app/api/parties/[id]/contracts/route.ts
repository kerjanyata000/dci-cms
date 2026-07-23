import { jsonError, jsonOk } from '@/lib/server/api-route'
import {
  computeLifecycleDates,
  mapContractRow,
  nextContractCode,
  type ContractRow,
} from '@/lib/contracts/types'
import { mapPartyRow, type PartyRow } from '@/lib/parties/types'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const runtime = 'nodejs'

type CreateBody = {
  contract_title?: string
  doc_type?: string
  agreement_no?: string
  agreement_date?: string
  duration_months?: number
  contract_value?: string
  owner?: string
  department?: string
  remarks?: string
  save_mode?: 'draft' | 'review'
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: partyId } = await context.params
    const body = (await request.json()) as CreateBody

    const contract_title = body.contract_title?.trim()
    if (!contract_title) return jsonError('contract_title is required', 400)

    const db = getSupabaseAdmin()

    const { data: partyRow, error: partyError } = await db
      .from('parties')
      .select('*')
      .eq('id', partyId)
      .single()

    if (partyError || !partyRow) return jsonError('Party not found', 404)

    const party = mapPartyRow(partyRow as PartyRow)
    if (party.party_status === 'Inactive') {
      return jsonError('Party Inactive tidak dapat dipilih untuk kontrak baru (BRL-CMS-031)', 400)
    }

    const saveMode = body.save_mode === 'review' ? 'review' : 'draft'
    const status = saveMode === 'review' ? 'under_review' : 'draft'
    const status_text = saveMode === 'review' ? 'Under Review' : 'Draft'

    const contract_code = await nextContractCode(db)

    let renewal_date: string | null = null
    let expiry_date: string | null = null
    const agreement_date = body.agreement_date?.trim() || null
    const duration_months =
      typeof body.duration_months === 'number' && body.duration_months > 0
        ? body.duration_months
        : null

    if (agreement_date && duration_months) {
      const computed = computeLifecycleDates(agreement_date, duration_months)
      renewal_date = computed.renewal_date
      expiry_date = computed.expiry_date
    }

    const confirmed_metadata = {
      counterpartyName: party.name,
      contractValue: body.contract_value?.trim() || undefined,
      agreementNo: body.agreement_no?.trim() || undefined,
      contractPeriod: duration_months ? `${duration_months} bulan` : undefined,
    }

    const { data, error } = await db
      .from('contracts')
      .insert({
        party_id: partyId,
        contract_code,
        contract_title,
        doc_type: body.doc_type?.trim() || null,
        agreement_no: body.agreement_no?.trim() || null,
        agreement_date,
        duration_months,
        renewal_date,
        expiry_date,
        owner: body.owner?.trim() || null,
        department: body.department?.trim() || null,
        remarks: body.remarks?.trim() || null,
        status,
        status_text,
        confirmed_metadata,
        validation_status: 'pending',
      })
      .select('*')
      .single()

    if (error) throw new Error(error.message)

    const contract = mapContractRow(data as ContractRow)

    await db.from('audit_logs').insert({
      action: `Contract Record dibuat — ${contract_title} [${contract_code}] (${status_text})`,
      action_type: 'create',
      party_id: partyId,
      contract_id: contract.id,
      actor_name: 'CMS',
      payload: { contract_code, status, save_mode: saveMode },
    })

    return jsonOk({ contract }, { status: 201 })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Failed to create contract', 500)
  }
}
