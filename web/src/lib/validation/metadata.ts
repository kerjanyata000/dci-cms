import type { ContractMetadata, ValidationStatus } from '../../types/cms'
import type { OdooPartner } from '../odoo/types'

export type ValidationIssue = {
  field: string
  extracted?: string
  confirmed?: string
  partner?: string
  message: string
}

/**
 * Pure CMS rules (no AI): compare extracted vs confirmed vs Odoo Partner.
 */
export function validateContractMetadata(input: {
  extracted: ContractMetadata
  confirmed: ContractMetadata
  partner?: OdooPartner | null
  confidence?: number
}): { status: ValidationStatus; issues: ValidationIssue[] } {
  const { extracted, confirmed, partner, confidence } = input
  const issues: ValidationIssue[] = []

  if (confidence != null && confidence < 0.7) {
    issues.push({
      field: '_confidence',
      message: `Low extraction confidence (${confidence}). Review all fields.`,
    })
  }

  const keys: (keyof ContractMetadata)[] = [
    'counterpartyName',
    'agreementNo',
    'npwp',
    'address',
    'contractValue',
    'contractPeriod',
  ]

  for (const field of keys) {
    const ex = (extracted[field] ?? '').trim()
    const cf = (confirmed[field] ?? '').trim()
    if (ex && cf && ex.toLowerCase() !== cf.toLowerCase()) {
      issues.push({
        field: String(field),
        extracted: ex,
        confirmed: cf,
        message: `Extracted "${field}" differs from confirmed value.`,
      })
    }
  }

  if (partner) {
    const name = confirmed.counterpartyName ?? extracted.counterpartyName
    const vat = confirmed.npwp ?? extracted.npwp
    const partnerVat = partner.vat ? String(partner.vat) : ''
    if (name && partner.name && name.toLowerCase() !== partner.name.toLowerCase()) {
      issues.push({
        field: 'counterpartyName',
        confirmed: name,
        partner: partner.name,
        message: 'Counterparty name differs from Odoo Partner.',
      })
    }
    if (vat && partnerVat && vat.replace(/\D/g, '') !== partnerVat.replace(/\D/g, '')) {
      issues.push({
        field: 'npwp',
        confirmed: vat,
        partner: partnerVat,
        message: 'NPWP differs from Odoo Partner VAT.',
      })
    }
  }

  if (issues.some((i) => i.field === '_confidence')) {
    return { status: 'low_confidence', issues }
  }
  if (issues.length) return { status: 'mismatch', issues }
  return { status: 'ok', issues }
}
