export type OdooPartner = {
  id: number
  name: string
  vat?: string | false
  ref?: string | false
  email?: string | false
  is_company?: boolean
  street?: string | false
  street2?: string | false
  city?: string | false
  zip?: string | false
  country_id?: [number, string] | false
}

export type OdooSaleOrder = {
  id: number
  name: string
  partner_id: [number, string] | number
  state: string
  date_order?: string
  amount_total?: number
  amount_untaxed?: number
  amount_tax?: number
  payment_term_id?: [number, string] | false
  client_order_ref?: string | false
  commitment_date?: string | false
  currency_id?: [number, string] | false
}

export type OdooSaleOrderLine = {
  id: number
  product_id?: [number, string] | false
  name: string
  product_uom_qty: number
  qty_delivered?: number
  qty_invoiced?: number
  price_unit: number
  price_subtotal?: number
  price_total?: number
}

export type OdooDomain = Array<string | number | boolean | OdooDomain>

export interface OdooClient {
  searchPartners(domain?: OdooDomain, fields?: string[], limit?: number): Promise<OdooPartner[]>
  searchOrders(domain?: OdooDomain, fields?: string[], limit?: number): Promise<OdooSaleOrder[]>
}
