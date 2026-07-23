import 'server-only'

import type { ContractMetadata, ValidationStatus } from '@/types/cms'
import {
  computeLifecycleDates,
  mapContractRow,
  nextContractCode,
  type ContractRow,
} from '@/lib/contracts/types'
import { extractAndPersistForContract } from '@/lib/documents/server'
import { searchOdooPartners } from '@/lib/odoo/server'
import { mapPartyRow, type PartyRow } from '@/lib/parties/types'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { ACTIVE_FOR_TERM } from '@/lib/contracts/constants'
import { validateContractMetadata } from '@/lib/validation/metadata'

export type CreateContractInput = {
  contract_title: string
  doc_type?: string
  agreement_no?: string
  agreement_date?: string
  duration_months?: number
  contract_value?: string
  owner?: string
  department?: string
  remarks?: string
  save_mode?: 'draft' | 'review'
  file?: File | null
}

export async function createPartyContract(partyId: string, body: CreateContractInput) {
  const contract_title = body.contract_title?.trim()
  if (!contract_title) throw new Error('contract_title is required')

  const db = getSupabaseAdmin()

  const { data: partyRow, error: partyError } = await db
    .from('parties')
    .select('*')
    .eq('id', partyId)
    .single()

  if (partyError || !partyRow) throw new Error('Party not found')

  const party = mapPartyRow(partyRow as PartyRow)
  if (party.party_status === 'Inactive') {
    throw new Error('Party Inactive tidak dapat dipilih untuk kontrak baru (BRL-CMS-031)')
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

  const confirmed_metadata: ContractMetadata = {
    counterpartyName: party.name,
    contractValue: body.contract_value?.trim() || undefined,
    agreementNo: body.agreement_no?.trim() || undefined,
    contractPeriod: duration_months ? `${duration_months} bulan` : undefined,
  }

  let extracted_metadata: ContractMetadata = {}
  let validation_status: ValidationStatus = 'pending'
  let validation_notes: string | null = null

  const { data, error } = await db
    .from('contracts')
    .insert({
      party_id: partyId,
      original_party_id: partyId,
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
      extracted_metadata,
      validation_status,
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  const contract = mapContractRow(data as ContractRow)

  if (body.file) {
    const { extracted, extractionError } = await extractAndPersistForContract({
      partyId,
      contractId: contract.id,
      file: body.file,
      confirmedMetadata: confirmed_metadata,
      odooPartnerId: party.odoo_partner_id,
    })

    extracted_metadata = extracted

    let partner = null
    if (party.odoo_partner_id != null) {
      const partners = await searchOdooPartners([['id', '=', party.odoo_partner_id]], 1)
      partner = partners[0] ?? null
    }

    const validation = validateContractMetadata({
      extracted: extracted_metadata,
      confirmed: confirmed_metadata,
      partner,
    })

    validation_status = extractionError ? 'pending' : validation.status
    validation_notes = extractionError
      ? extractionError
      : validation.issues.length
        ? validation.issues.map((i) => i.message).join('; ')
        : null

    if (extracted.agreementNo && !body.agreement_no?.trim()) {
      await db.from('contracts').update({ agreement_no: extracted.agreementNo }).eq('id', contract.id)
      contract.agreement_no = extracted.agreementNo
    }

    await db
      .from('contracts')
      .update({
        extracted_metadata,
        validation_status,
        validation_notes,
      })
      .eq('id', contract.id)

    contract.extracted_metadata = extracted_metadata
    contract.validation_status = validation_status
    contract.validation_notes = validation_notes
  }

  await db.from('audit_logs').insert({
    action: `Contract Record dibuat — ${contract_title} [${contract_code}] (${status_text})`,
    action_type: 'create',
    party_id: partyId,
    contract_id: contract.id,
    actor_name: 'CMS',
    payload: {
      contract_code,
      status,
      save_mode: saveMode,
      has_document: Boolean(body.file),
      validation_status,
    },
  })

  return contract
}

export async function nextAmendmentCode(db: ReturnType<typeof getSupabaseAdmin>, parentCode: string) {
  const prefix = `${parentCode}-AMD-`
  const { data } = await db
    .from('contract_amendments')
    .select('amendment_code')
    .like('amendment_code', `${prefix}%`)
    .order('amendment_code', { ascending: false })
    .limit(1)

  const last = data?.[0]?.amendment_code
  const match = last?.match(/AMD-(\d+)$/i)
  const n = match ? Number.parseInt(match[1], 10) + 1 : 1
  return `${prefix}${String(n).padStart(2, '0')}`
}

export type AmendmentRow = {
  id: string
  parent_contract_id: string
  party_id: string
  amendment_code: string
  title: string
  doc_type: string
  change_category: string | null
  effective_date: string | null
  reason: string | null
  summary: string | null
  status: string
  status_text: string
  created_at: string
}

export function mapAmendmentRow(row: AmendmentRow) {
  return {
    id: row.id,
    parent_contract_id: row.parent_contract_id,
    party_id: row.party_id,
    amendment_code: row.amendment_code,
    title: row.title,
    doc_type: row.doc_type,
    change_category: row.change_category,
    effective_date: row.effective_date,
    reason: row.reason,
    summary: row.summary,
    status: row.status,
    status_text: row.status_text,
    created_at: row.created_at,
  }
}

export async function createAmendment(
  parentContractId: string,
  body: {
    title: string
    change_category?: string
    effective_date?: string
    reason?: string
    summary?: string
    doc_type?: string
  },
) {
  const db = getSupabaseAdmin()

  const { data: parent, error: parentError } = await db
    .from('contracts')
    .select('*')
    .eq('id', parentContractId)
    .single()

  if (parentError || !parent) throw new Error('Parent contract not found')

  const title = body.title?.trim()
  if (!title) throw new Error('title is required')

  const amendment_code = await nextAmendmentCode(db, parent.contract_code as string)

  const { data, error } = await db
    .from('contract_amendments')
    .insert({
      parent_contract_id: parentContractId,
      party_id: parent.party_id,
      amendment_code,
      title,
      doc_type: body.doc_type?.trim() || 'Amendment',
      change_category: body.change_category?.trim() || null,
      effective_date: body.effective_date?.trim() || null,
      reason: body.reason?.trim() || null,
      summary: body.summary?.trim() || null,
      status: 'draft',
      status_text: 'Draft',
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  const amendment = mapAmendmentRow(data as AmendmentRow)

  await db.from('audit_logs').insert({
    action: `Amendment dibuat — ${title} [${amendment_code}] → ${parent.contract_code}`,
    action_type: 'amendment',
    party_id: parent.party_id,
    contract_id: parentContractId,
    actor_name: 'CMS',
    payload: { amendment_code, parent_contract_code: parent.contract_code },
  })

  return amendment
}

export type TerminationRow = {
  id: string
  contract_id: string
  party_id: string
  termination_type: string | null
  effective_date: string
  reason: string | null
  summary: string | null
  status: string
  created_at: string
}

export function mapTerminationRow(row: TerminationRow) {
  return {
    id: row.id,
    contract_id: row.contract_id,
    party_id: row.party_id,
    termination_type: row.termination_type,
    effective_date: row.effective_date,
    reason: row.reason,
    summary: row.summary,
    status: row.status,
    created_at: row.created_at,
  }
}

export async function createEarlyTermination(
  contractId: string,
  body: {
    termination_type?: string
    effective_date: string
    reason?: string
    summary?: string
  },
) {
  const db = getSupabaseAdmin()

  const { data: contract, error: contractError } = await db
    .from('contracts')
    .select('*')
    .eq('id', contractId)
    .single()

  if (contractError || !contract) throw new Error('Contract not found')

  if (!ACTIVE_FOR_TERM.includes(String(contract.status))) {
    throw new Error('Early Termination hanya dari kontrak Active (BRL-CMS-013 / FR-CNT-TERM-001)')
  }

  const effective_date = body.effective_date?.trim()
  if (!effective_date) throw new Error('effective_date is required')

  const today = new Date().toISOString().slice(0, 10)
  const isFuture = effective_date > today

  const { data, error } = await db
    .from('contract_terminations')
    .insert({
      contract_id: contractId,
      party_id: contract.party_id,
      termination_type: body.termination_type?.trim() || 'Early Termination',
      effective_date,
      reason: body.reason?.trim() || null,
      summary: body.summary?.trim() || null,
      status: isFuture ? 'scheduled' : 'completed',
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  if (isFuture) {
    await db
      .from('contracts')
      .update({ status_text: 'Termination Scheduled' })
      .eq('id', contractId)
  } else {
    await db
      .from('contracts')
      .update({ status: 'terminated', status_text: 'Terminated' })
      .eq('id', contractId)
  }

  const termination = mapTerminationRow(data as TerminationRow)

  await db.from('audit_logs').insert({
    action: `Early Termination — ${contract.contract_code} effective ${effective_date}`,
    action_type: 'termination',
    party_id: contract.party_id,
    contract_id: contractId,
    actor_name: 'CMS',
    payload: { effective_date, scheduled: isFuture },
  })

  return termination
}

export type CounterpartyChangeRow = {
  id: string
  contract_id: string
  from_party_id: string
  to_party_id: string
  change_type: string
  effective_date: string | null
  reason: string
  created_at: string
}

export function mapCounterpartyChangeRow(row: CounterpartyChangeRow) {
  return { ...row }
}

const CORRECTION_STATUSES = ['draft', 'under_review']
const BLOCKED_CP_STATUSES = ['waiting_for_signature', 'ready_for_sign']

const STATUS_ACTIONS: Record<
  string,
  { status: string; status_text: string; allowedFrom: string[] }
> = {
  submit_review: {
    status: 'under_review',
    status_text: 'Under Review',
    allowedFrom: ['draft'],
  },
  send_to_cp: {
    status: 'sent',
    status_text: 'Sent to Counterparty',
    allowedFrom: ['under_review'],
  },
  ready_for_sign: {
    status: 'ready_for_sign',
    status_text: 'Waiting for Signature',
    allowedFrom: ['sent'],
  },
  mark_active: {
    status: 'active',
    status_text: 'Active',
    allowedFrom: ['ready_for_sign', 'sent', 'fully_signed'],
  },
  mark_fully_signed: {
    status: 'fully_signed',
    status_text: 'Fully Signed',
    allowedFrom: ['ready_for_sign', 'sent'],
  },
  back_to_draft: {
    status: 'draft',
    status_text: 'Draft',
    allowedFrom: ['under_review', 'sent'],
  },
}

export async function getContractById(contractId: string) {
  const db = getSupabaseAdmin()
  const { data, error } = await db.from('contracts').select('*').eq('id', contractId).single()
  if (error || !data) throw new Error('Contract not found')
  return mapContractRow(data as ContractRow)
}

export async function confirmContractMetadata(
  contractId: string,
  confirmed: ContractMetadata,
) {
  const db = getSupabaseAdmin()
  const contract = await getContractById(contractId)

  const merged = { ...contract.confirmed_metadata, ...confirmed }
  const { data: partyRow } = await db
    .from('parties')
    .select('*')
    .eq('id', contract.party_id)
    .single()

  let partner = null
  if (partyRow?.odoo_partner_id != null) {
    const partners = await searchOdooPartners([['id', '=', partyRow.odoo_partner_id]], 1)
    partner = partners[0] ?? null
  }

  const validation = validateContractMetadata({
    extracted: contract.extracted_metadata,
    confirmed: merged,
    partner,
  })

  const { data, error } = await db
    .from('contracts')
    .update({
      confirmed_metadata: merged,
      validation_status: validation.status,
      validation_notes: validation.issues.map((i) => i.message).join('; ') || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contractId)
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  await db.from('audit_logs').insert({
    action: `Metadata dikonfirmasi — ${contract.contract_code} (${validation.status})`,
    action_type: 'update',
    party_id: contract.party_id,
    contract_id: contractId,
    actor_name: 'CMS',
    payload: { validation_status: validation.status },
  })

  return mapContractRow(data as ContractRow)
}

export async function transitionContractStatus(contractId: string, action: string) {
  const spec = STATUS_ACTIONS[action]
  if (!spec) throw new Error(`Unknown status action: ${action}`)

  const contract = await getContractById(contractId)
  if (!spec.allowedFrom.includes(contract.status)) {
    throw new Error(
      `Tidak bisa ${action} dari status ${contract.status_text} (${contract.status})`,
    )
  }

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('contracts')
    .update({
      status: spec.status,
      status_text: spec.status_text,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contractId)
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  await db.from('audit_logs').insert({
    action: `Status kontrak → ${spec.status_text} [${contract.contract_code}]`,
    action_type: 'status',
    party_id: contract.party_id,
    contract_id: contractId,
    actor_name: 'CMS',
    payload: { from: contract.status, to: spec.status, action },
  })

  return mapContractRow(data as ContractRow)
}

export type EditContractAdminInput = {
  contract_title: string
  owner?: string
  department?: string
  remarks?: string
}

const EDITABLE_ADMIN_FIELDS = ['contract_title', 'owner', 'department', 'remarks'] as const

export async function updateContractAdminDetails(
  contractId: string,
  body: EditContractAdminInput,
) {
  const contract_title = body.contract_title?.trim()
  if (!contract_title) {
    throw new Error('Internal title wajib diisi (FR-CNT-EDIT-004)')
  }

  const contract = await getContractById(contractId)
  const updates = {
    contract_title,
    owner: body.owner?.trim() || null,
    department: body.department?.trim() || null,
    remarks: body.remarks?.trim() || null,
  }

  const changes: Record<string, { from: unknown; to: unknown }> = {}
  for (const field of EDITABLE_ADMIN_FIELDS) {
    const from = contract[field]
    const to = updates[field]
    if (from !== to) changes[field] = { from, to }
  }

  if (!Object.keys(changes).length) return contract

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('contracts')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contractId)
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  await db.from('audit_logs').insert({
    action: `Edit Contract Details — ${contract.contract_code}`,
    action_type: 'edit_admin',
    party_id: contract.party_id,
    contract_id: contractId,
    actor_name: 'CMS',
    payload: { changes },
  })

  return mapContractRow(data as ContractRow)
}

export async function changeContractCounterparty(
  contractId: string,
  body: {
    to_party_id: string
    change_type: string
    effective_date?: string
    reason: string
  },
) {
  const reason = body.reason?.trim()
  if (!reason) throw new Error('reason wajib diisi (FR-CNT-CP-008)')

  const db = getSupabaseAdmin()
  const { data: contractRow, error: contractError } = await db
    .from('contracts')
    .select('*')
    .eq('id', contractId)
    .single()

  if (contractError || !contractRow) throw new Error('Contract not found')

  const contract = mapContractRow(contractRow as ContractRow)
  const changeType = body.change_type?.trim() || 'Other'

  if (BLOCKED_CP_STATUSES.includes(contract.status)) {
    throw new Error(
      'Batalkan/revisi proses tanda tangan dulu sebelum Change Counterparty (BRL-CMS-009)',
    )
  }

  if (changeType === 'Correction' && !CORRECTION_STATUSES.includes(contract.status)) {
    throw new Error('Correction hanya untuk Draft / Under Review (BRL-CMS-008)')
  }

  const toPartyId = body.to_party_id
  if (toPartyId === contract.party_id) {
    throw new Error('Party tujuan sama dengan party kontrak saat ini')
  }

  const { data: toParty, error: toError } = await db
    .from('parties')
    .select('*')
    .eq('id', toPartyId)
    .single()

  if (toError || !toParty) throw new Error('Target party not found')
  if (toParty.party_status === 'Inactive') {
    throw new Error('Party Inactive tidak dapat dipilih (BRL-CMS-031)')
  }

  const fromPartyId = contract.party_id

  const { data: changeRow, error: changeError } = await db
    .from('contract_counterparty_changes')
    .insert({
      contract_id: contractId,
      from_party_id: fromPartyId,
      to_party_id: toPartyId,
      change_type: changeType,
      effective_date: body.effective_date?.trim() || null,
      reason,
    })
    .select('*')
    .single()

  if (changeError) throw new Error(changeError.message)

  const originalPartyId = contract.original_party_id ?? fromPartyId

  const { data: updated, error: updateError } = await db
    .from('contracts')
    .update({
      party_id: toPartyId,
      original_party_id: originalPartyId,
      confirmed_metadata: {
        ...contract.confirmed_metadata,
        counterpartyName: toParty.name,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', contractId)
    .select('*')
    .single()

  if (updateError) throw new Error(updateError.message)

  await db.from('audit_logs').insert({
    action: `Change Counterparty (${changeType}) — ${contract.contract_code} → ${toParty.name}`,
    action_type: 'cp',
    party_id: toPartyId,
    contract_id: contractId,
    actor_name: 'CMS',
    payload: {
      from_party_id: fromPartyId,
      to_party_id: toPartyId,
      change_type: changeType,
      effective_date: body.effective_date ?? null,
    },
  })

  return {
    contract: mapContractRow(updated as ContractRow),
    change: mapCounterpartyChangeRow(changeRow as CounterpartyChangeRow),
  }
}
