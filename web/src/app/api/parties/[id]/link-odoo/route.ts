import { jsonError, jsonOk } from '@/lib/server/api-route'
import { searchOdooPartners } from '@/lib/odoo/server'
import { buildOdooComparison } from '@/lib/parties/odoo-link'
import { evaluateOdooLinkStatus, mapPartyRow, type PartyRow } from '@/lib/parties/types'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const runtime = 'nodejs'

type Body = {
  odooPartnerId?: number
  preview?: boolean
  reason?: string
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const body = (await request.json()) as Body
    const odooPartnerId = body.odooPartnerId

    if (odooPartnerId == null || Number.isNaN(odooPartnerId)) {
      return jsonError('odooPartnerId is required', 400)
    }

    const db = getSupabaseAdmin()
    const { data: existing, error: loadError } = await db
      .from('parties')
      .select('*')
      .eq('id', id)
      .single()

    if (loadError || !existing) {
      return jsonError('Party not found', 404)
    }

    const partyRow = existing as PartyRow
    const partners = await searchOdooPartners([['id', '=', odooPartnerId]], 1)
    const partner = partners[0]
    if (!partner) return jsonError('Odoo Partner not found', 404)

    const suggestedStatus = evaluateOdooLinkStatus(partyRow.name, partner.name)
    const comparison = buildOdooComparison(partyRow.name, partner)

    if (body.preview) {
      return jsonOk({
        party: mapPartyRow(partyRow),
        partner,
        suggestedStatus,
        comparison,
      })
    }

    const previousLinked =
      partyRow.odoo_link_status === 'linked' &&
      partyRow.odoo_partner_id != null &&
      partyRow.odoo_partner_id !== odooPartnerId

    if (previousLinked && !body.reason?.trim()) {
      return jsonError('reason is required for relink', 400)
    }

    const nextStatus = suggestedStatus

    const { data: updated, error: updateError } = await db
      .from('parties')
      .update({
        odoo_partner_id: odooPartnerId,
        odoo_link_status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) throw new Error(updateError.message)

    const party = mapPartyRow(updated as PartyRow)

    await db.from('audit_logs').insert({
      action: previousLinked
        ? `Odoo Partner relink — ${party.name} → #${odooPartnerId}`
        : `Odoo Partner linked — ${party.name} → #${odooPartnerId} (${nextStatus})`,
      action_type: 'link',
      party_id: party.id,
      actor_name: 'CMS',
      payload: {
        odoo_partner_id: odooPartnerId,
        odoo_link_status: nextStatus,
        reason: body.reason ?? null,
        comparison,
      },
    })

    return jsonOk({ party, partner, suggestedStatus: nextStatus, comparison })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Failed to link Odoo', 500)
  }
}
