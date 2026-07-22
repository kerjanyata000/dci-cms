import type { OdooClient, OdooDomain, OdooPartner, OdooSaleOrder } from './types'


/** Seed aligned with docs/CHECKLIST-ODOO-TRIAL-DAN-AI.md */
const PARTNERS: OdooPartner[] = [
  {
    id: 101,
    name: 'PT Alpha Data Center',
    vat: '10.20.30.40.50.6000',
    ref: 'CUST-001',
    email: 'legal@alpha.example',
    is_company: true,
    street: 'Jl. Gatot Subroto 1',
    city: 'Jakarta',
  },
  {
    id: 103,
    name: 'PT Beta Nusantara',
    vat: '11.22.33.44.55.6600',
    ref: 'CUST-006',
    email: 'ops@beta.example',
    is_company: true,
    street: 'Jl. Sudirman 6',
    city: 'Jakarta',
  },
  {
    id: 123,
    name: 'CV Gamma Solusi',
    vat: false,
    ref: 'CUST-023',
    email: 'admin@gamma.example',
    is_company: true,
    street: 'Jl. Asia Afrika 23',
    city: 'Bandung',
  },
  {
    id: 179,
    name: 'PT Delta Cloud',
    vat: '99.88.77.66.55.4400',
    ref: 'CUST-079',
    email: 'finance@delta.example',
    is_company: true,
    street: 'Jl. Merdeka 79',
    city: 'Surabaya',
  },
  {
    id: 198,
    name: 'PT Epsilon Mistmatch',
    vat: '12.12.12.12.12.1200',
    ref: 'CUST-098',
    email: 'contact@epsilon.example',
    is_company: true,
    street: 'Jl. Salah Alamat 98',
    city: 'Medan',
  },
  {
    id: 999,
    name: 'Acme Personal',
    vat: false,
    ref: false,
    email: 'acme@example.com',
    is_company: false,
    street: 'Jl. Individu 1',
    city: 'Depok',
  },
]

const ORDERS: OdooSaleOrder[] = [
  {
    id: 1,
    name: 'SO001',
    partner_id: [101, 'PT Alpha Data Center'],
    state: 'sale',
    date_order: '2026-01-10',
    amount_total: 120000000,
  },
  {
    id: 2,
    name: 'SO002',
    partner_id: [101, 'PT Alpha Data Center'],
    state: 'sale',
    date_order: '2026-03-01',
    amount_total: 45000000,
  },
  {
    id: 3,
    name: 'SO006',
    partner_id: [103, 'PT Beta Nusantara'],
    state: 'sale',
    date_order: '2026-02-15',
    amount_total: 88000000,
  },
  {
    id: 4,
    name: 'SO023',
    partner_id: [123, 'CV Gamma Solusi'],
    state: 'draft',
    date_order: '2026-04-01',
    amount_total: 10000000,
  },
  {
    id: 5,
    name: 'SO098',
    partner_id: [198, 'PT Epsilon Mistmatch'],
    state: 'cancel',
    date_order: '2025-11-01',
    amount_total: 0,
  },
]

function matchDomain(row: Record<string, unknown>, domain: OdooDomain = []): boolean {
  for (const rule of domain) {
    if (!Array.isArray(rule) || rule.length < 3) continue
    const [field, op, value] = rule
    const raw = row[field as string]
    const cell = Array.isArray(raw) ? raw[0] : raw
    if (op === '=' && cell !== value) return false
    if (
      op === 'ilike' &&
      !String(cell ?? '')
        .toLowerCase()
        .includes(String(value).replace(/%/g, '').toLowerCase())
    ) {
      return false
    }
    if (op === 'in' && Array.isArray(value) && !value.includes(cell as never)) return false
  }
  return true
}

export const dummyOdooClient: OdooClient = {
  async searchPartners(domain = [], fields, limit = 50) {
    const rows = PARTNERS.filter((p) =>
      matchDomain(p as unknown as Record<string, unknown>, domain),
    ).slice(0, limit)
    if (!fields?.length) return rows
    return rows.map((r) => {
      const o: Record<string, unknown> = { id: r.id }
      for (const f of fields) {
        if (f in r) o[f] = (r as Record<string, unknown>)[f]
      }
      return o as OdooPartner
    })
  },
  async searchOrders(domain = [], fields, limit = 50) {
    const rows = ORDERS.filter((o) =>
      matchDomain(o as unknown as Record<string, unknown>, domain),
    ).slice(0, limit)
    if (!fields?.length) return rows
    return rows.map((r) => {
      const o: Record<string, unknown> = { id: r.id }
      for (const f of fields) {
        if (f in r) o[f] = (r as Record<string, unknown>)[f]
      }
      return o as OdooSaleOrder
    })
  },
}
