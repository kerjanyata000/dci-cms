import type { OdooClient } from './types'
import { dummyOdooClient } from './dummy'

export type OdooMode = 'dummy' | 'live'

export const ODOO_MODE: OdooMode =
  (import.meta.env.VITE_ODOO_MODE as OdooMode | undefined) ?? 'dummy'

/**
 * Live XML-RPC/JSON client is intentionally stubbed.
 * Wire credentials via env only on the server (Edge Function), never in the browser.
 */
const liveOdooClient: OdooClient = {
  async searchPartners() {
    throw new Error(
      'Odoo live client must run on the server (Supabase Edge Function). Use ODOO_MODE=dummy in the browser.',
    )
  },
  async searchOrders() {
    throw new Error(
      'Odoo live client must run on the server (Supabase Edge Function). Use ODOO_MODE=dummy in the browser.',
    )
  },
}

export function getOdooClient(): OdooClient {
  return ODOO_MODE === 'live' ? liveOdooClient : dummyOdooClient
}

export type { OdooClient, OdooPartner, OdooSaleOrder, OdooDomain } from './types'
