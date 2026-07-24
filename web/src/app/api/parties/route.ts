import { authErrorResponse, requireActor, requireCanEdit } from '@/lib/auth/guard'
import { enrichPartiesWithContracts } from '@/lib/parties/list'
import { jsonError, jsonOk } from '@/lib/server/api-route'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { mapPartyRow, nextPartyCode, type PartyRow } from '@/lib/parties/types'
import type { OdooLinkStatus } from '@/types/cms'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    await requireActor(request)
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim() ?? ''
    const linkStatus = searchParams.get('linkStatus') as OdooLinkStatus | 'all' | null
    const pic = searchParams.get('pic')?.trim() ?? ''
    const contractStatus = searchParams.get('contractStatus')?.trim() ?? ''

    const db = getSupabaseAdmin()
    let query = db.from('parties').select('*').order('party_code', { ascending: true })

    if (q) query = query.ilike('name', `%${q}%`)
    if (pic) query = query.ilike('pic', `%${pic}%`)
    if (linkStatus && linkStatus !== 'all') {
      query = query.eq('odoo_link_status', linkStatus)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)

    const parties = (data as PartyRow[]).map(mapPartyRow)
    const partyIds = parties.map((p) => p.id)

    let contractsQuery = db
      .from('contracts')
      .select(
        'party_id, contract_title, agreement_date, duration_months, status, status_text, created_at',
      )

    if (partyIds.length > 0) {
      contractsQuery = contractsQuery.in('party_id', partyIds)
    }

    const { data: contractRows, error: contractsError } = await contractsQuery
    if (contractsError) throw new Error(contractsError.message)

    let list = enrichPartiesWithContracts(parties, contractRows ?? [])

    if (contractStatus && contractStatus !== 'all') {
      list = list.filter((p) => p.primary_contract?.status === contractStatus)
    }

    return jsonOk({ parties: list })
  } catch (err) {
    const auth = authErrorResponse(err)
    if (auth) return auth
    return jsonError(err instanceof Error ? err.message : 'Failed to list parties', 500)
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireCanEdit(request)
    const body = (await request.json()) as { name?: string; pic?: string }
    const name = body.name?.trim()
    if (!name) return jsonError('name is required', 400)

    const db = getSupabaseAdmin()
    const party_code = await nextPartyCode(db)

    const { data, error } = await db
      .from('parties')
      .insert({
        party_code,
        name,
        pic: body.pic?.trim() || null,
        odoo_link_status: 'pending',
        party_status: 'Active',
      })
      .select('*')
      .single()

    if (error) throw new Error(error.message)

    const party = mapPartyRow(data as PartyRow)

    await db.from('audit_logs').insert({
      action: `Party Record dibuat — ${party.name}`,
      action_type: 'create',
      party_id: party.id,
      actor_name: actor.name,
      payload: { party_code: party.party_code, odoo_link_status: party.odoo_link_status },
    })

    return jsonOk({ party }, { status: 201 })
  } catch (err) {
    const auth = authErrorResponse(err)
    if (auth) return auth
    return jsonError(err instanceof Error ? err.message : 'Failed to create party', 500)
  }
}
