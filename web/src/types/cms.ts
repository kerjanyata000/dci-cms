export type AppRole = 'legal' | 'business' | 'finance' | 'management' | 'it'

export type OdooLinkStatus =
  | 'unlinked'
  | 'pending'
  | 'linked'
  | 'mismatch'
  | 'relink'
  | 'not_required'

export type ValidationStatus = 'pending' | 'ok' | 'mismatch' | 'low_confidence'

export type DocumentStatus =
  | 'pending_upload'
  | 'pending_extraction'
  | 'extracted'
  | 'confirmed'
  | 'failed'

/** BRD-aligned contract metadata fields (extracted vs confirmed). */
export type ContractMetadata = {
  counterpartyName?: string
  agreementNo?: string
  contractPeriod?: string
  contractValue?: string
  npwp?: string
  address?: string
  signer?: string
  paymentTerm?: string
  latePaymentPenalty?: string
  earlyTerminationFee?: string
  autoRenewal?: string
  [key: string]: string | undefined
}

export type Party = {
  id: string
  party_code: string
  name: string
  pic: string | null
  odoo_partner_id: number | null
  odoo_link_status: OdooLinkStatus
  party_status: string
}

export type Contract = {
  id: string
  party_id: string
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
}

export type SaleOrderRow = {
  id: string
  party_id: string | null
  odoo_order_id: number
  odoo_partner_id: number | null
  name: string
  state: string
  amount_total: number | null
  date_order: string | null
  synced_at: string
}

export type DocumentRow = {
  id: string
  party_id: string | null
  contract_id: string | null
  storage_path: string
  file_name: string
  mime_type: string | null
  status: DocumentStatus
  ragflow_dataset_id: string | null
  ragflow_doc_id: string | null
  extraction_error: string | null
}
