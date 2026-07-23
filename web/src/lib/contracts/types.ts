import type { Contract, ContractMetadata, ValidationStatus } from '@/types/cms'
import type { SupabaseClient } from '@supabase/supabase-js'

export type ContractRow = {
  id: string
  party_id: string
  original_party_id: string | null
  contract_code: string
  contract_title: string | null
  doc_type: string | null
  agreement_no: string | null
  agreement_date: string | null
  duration_months: number | null
  renewal_date: string | null
  expiry_date: string | null
  owner: string | null
  department: string | null
  remarks: string | null
  status: string
  status_text: string
  extracted_metadata: ContractMetadata
  confirmed_metadata: ContractMetadata
  validation_status: ValidationStatus
  validation_notes: string | null
  created_at?: string
  updated_at?: string
}

export function mapContractRow(row: ContractRow): Contract {
  return {
    id: row.id,
    party_id: row.party_id,
    original_party_id: row.original_party_id ?? row.party_id,
    contract_code: row.contract_code,
    contract_title: row.contract_title,
    doc_type: row.doc_type,
    agreement_no: row.agreement_no,
    agreement_date: row.agreement_date,
    duration_months: row.duration_months,
    renewal_date: row.renewal_date,
    expiry_date: row.expiry_date,
    owner: row.owner,
    department: row.department,
    remarks: row.remarks,
    status: row.status,
    status_text: row.status_text,
    extracted_metadata: row.extracted_metadata ?? {},
    confirmed_metadata: row.confirmed_metadata ?? {},
    validation_status: row.validation_status,
    validation_notes: row.validation_notes,
  }
}

export async function nextContractCode(db: SupabaseClient): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `CMS-${year}-`
  const { data } = await db
    .from('contracts')
    .select('contract_code')
    .like('contract_code', `${prefix}%`)
    .order('contract_code', { ascending: false })
    .limit(1)

  const last = data?.[0]?.contract_code
  const match = last?.match(/CMS-\d+-(\d+)/i)
  const n = match ? Number.parseInt(match[1], 10) + 1 : 1
  return `${prefix}${String(n).padStart(4, '0')}`
}

export function computeLifecycleDates(agreementDate: string, durationMonths: number) {
  const start = new Date(`${agreementDate}T00:00:00`)
  const expiry = new Date(start)
  expiry.setMonth(expiry.getMonth() + durationMonths)
  const renewal = new Date(expiry)
  renewal.setDate(renewal.getDate() - 90)

  const toIso = (d: Date) => d.toISOString().slice(0, 10)
  return { expiry_date: toIso(expiry), renewal_date: toIso(renewal) }
}
