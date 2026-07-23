import type { OdooPartner } from '@/lib/odoo/types'
import { evaluateOdooLinkStatus } from './types'

export type OdooLinkComparison = {
  field: string
  cms: string
  odoo: string
  match: boolean
}

export function buildOdooComparison(partyName: string, partner: OdooPartner): OdooLinkComparison[] {
  const cmsName = partyName.trim()
  const odooName = String(partner.name ?? '').trim()
  const nameMatch = evaluateOdooLinkStatus(cmsName, odooName) === 'linked'

  return [
    { field: 'Legal name', cms: cmsName || '—', odoo: odooName || '—', match: nameMatch },
    {
      field: 'NPWP / VAT',
      cms: '—',
      odoo: partner.vat ? String(partner.vat) : '—',
      match: true,
    },
    {
      field: 'Ref / code',
      cms: '—',
      odoo: partner.ref ? String(partner.ref) : '—',
      match: true,
    },
    {
      field: 'Odoo Partner ID',
      cms: '—',
      odoo: String(partner.id),
      match: true,
    },
  ]
}
