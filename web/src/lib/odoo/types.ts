export type OdooPartner = {
  id: number
  name: string
  vat?: string | false
  ref?: string | false
  email?: string | false
  is_company?: boolean
  street?: string | false
  city?: string | false
}

export type OdooSaleOrder = {
  id: number
  name: string
  partner_id: [number, string] | number
  state: string
  date_order?: string
  amount_total?: number
}

export type OdooDomain = Array<string | number | boolean | OdooDomain>

export interface OdooClient {
  searchPartners(domain?: OdooDomain, fields?: string[], limit?: number): Promise<OdooPartner[]>
  searchOrders(domain?: OdooDomain, fields?: string[], limit?: number): Promise<OdooSaleOrder[]>
}
