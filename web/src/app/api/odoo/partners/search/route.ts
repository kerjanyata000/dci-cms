import { jsonError, jsonOk } from '@/lib/server/api-route'
import { searchOdooPartners } from '@/lib/odoo/server'
import type { OdooDomain } from '@/lib/odoo/types'

export const runtime = 'nodejs'

type Body = {
  domain?: OdooDomain
  limit?: number
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body
    const partners = await searchOdooPartners(body.domain ?? [], body.limit ?? 50)
    return jsonOk({ partners })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Partner search failed', 500)
  }
}
