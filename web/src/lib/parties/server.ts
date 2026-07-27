import 'server-only'

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { mapPartyRow, normalizePartyName, type PartyRow } from '@/lib/parties/types'

export type UpdatePartyInput = {
  name?: string
  pic?: string | null
  npwp?: string | null
  address?: string | null
  party_type?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  party_status?: 'Active' | 'Inactive'
}

function normalizeNpwp(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '')
}

/** FR-PTY-ADD-004 / EDIT — block duplicate name (normalized) or NPWP. */
export async function assertNoDuplicateParty(input: {
  name: string
  npwp?: string | null
  excludeId?: string
}) {
  const db = getSupabaseAdmin()
  const nameKey = normalizePartyName(input.name)
  if (!nameKey) throw new Error('Nama party wajib diisi')

  const { data: rows, error } = await db.from('parties').select('id, name, npwp, party_code')
  if (error) throw new Error(error.message)

  const npwpKey = normalizeNpwp(input.npwp)
  for (const row of rows ?? []) {
    if (input.excludeId && row.id === input.excludeId) continue
    if (normalizePartyName(String(row.name ?? '')) === nameKey) {
      throw new Error(
        `Party dengan nama serupa sudah ada (${row.party_code}). Periksa duplikat atau gunakan party yang ada.`,
      )
    }
    if (npwpKey && normalizeNpwp(row.npwp as string | null) === npwpKey) {
      throw new Error(
        `NPWP sudah terpakai pada ${row.party_code}. Tidak boleh duplikat.`,
      )
    }
  }
}

export type PartyUsage = {
  contracts: number
  amendments: number
  terminations: number
  documents: number
  saleOrders: number
  counterpartyChanges: number
  canHardDelete: boolean
}

export async function getPartyUsage(partyId: string): Promise<PartyUsage> {
  const db = getSupabaseAdmin()
  const [contracts, amendments, terminations, documents, saleOrders, cpFrom, cpTo] =
    await Promise.all([
      db.from('contracts').select('id', { count: 'exact', head: true }).eq('party_id', partyId),
      db.from('contract_amendments').select('id', { count: 'exact', head: true }).eq('party_id', partyId),
      db.from('contract_terminations').select('id', { count: 'exact', head: true }).eq('party_id', partyId),
      db.from('documents').select('id', { count: 'exact', head: true }).eq('party_id', partyId),
      db.from('sale_orders').select('id', { count: 'exact', head: true }).eq('party_id', partyId),
      db
        .from('contract_counterparty_changes')
        .select('id', { count: 'exact', head: true })
        .eq('from_party_id', partyId),
      db
        .from('contract_counterparty_changes')
        .select('id', { count: 'exact', head: true })
        .eq('to_party_id', partyId),
    ])

  const usage: PartyUsage = {
    contracts: contracts.count ?? 0,
    amendments: amendments.count ?? 0,
    terminations: terminations.count ?? 0,
    documents: documents.count ?? 0,
    saleOrders: saleOrders.count ?? 0,
    counterpartyChanges: (cpFrom.count ?? 0) + (cpTo.count ?? 0),
    canHardDelete: false,
  }
  usage.canHardDelete =
    usage.contracts === 0 &&
    usage.amendments === 0 &&
    usage.terminations === 0 &&
    usage.documents === 0 &&
    usage.saleOrders === 0 &&
    usage.counterpartyChanges === 0

  return usage
}

/** FR-PTY-DEL-003 — hard delete only when unused; else deactivate. */
export async function deletePartyIfUnused(partyId: string) {
  const db = getSupabaseAdmin()
  const { data: existing, error: findError } = await db
    .from('parties')
    .select('*')
    .eq('id', partyId)
    .single()

  if (findError || !existing) throw new Error('Party not found')

  const usage = await getPartyUsage(partyId)
  if (!usage.canHardDelete) {
    throw new Error(
      'Party masih terpakai (kontrak / dokumen / SO / riwayat). Nonaktifkan saja — tidak bisa hard delete.',
    )
  }

  const party = mapPartyRow(existing as PartyRow)

  await db.from('audit_logs').insert({
    action: `Party dihapus — ${party.name} [${party.party_code}]`,
    action_type: 'delete',
    party_id: null,
    actor_name: 'CMS',
    payload: {
      deleted_party_id: partyId,
      party_code: party.party_code,
      name: party.name,
    },
  })

  const { error } = await db.from('parties').delete().eq('id', partyId)
  if (error) throw new Error(error.message)

  return { deleted: true as const, party }
}

export async function updateParty(partyId: string, input: UpdatePartyInput) {
  const db = getSupabaseAdmin()
  const { data: existing, error: findError } = await db
    .from('parties')
    .select('*')
    .eq('id', partyId)
    .single()

  if (findError || !existing) throw new Error('Party not found')

  const name = input.name?.trim()
  if (name !== undefined && !name) throw new Error('Nama party wajib diisi')

  const nextName = name ?? (existing as PartyRow).name
  const nextNpwp =
    input.npwp !== undefined ? input.npwp?.trim() || null : ((existing as PartyRow).npwp ?? null)

  if (input.name !== undefined || input.npwp !== undefined) {
    await assertNoDuplicateParty({
      name: nextName,
      npwp: nextNpwp,
      excludeId: partyId,
    })
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (name !== undefined) patch.name = name
  if (input.pic !== undefined) patch.pic = input.pic?.trim() || null
  if (input.npwp !== undefined) patch.npwp = input.npwp?.trim() || null
  if (input.address !== undefined) patch.address = input.address?.trim() || null
  if (input.party_type !== undefined) patch.party_type = input.party_type?.trim() || null
  if (input.contact_email !== undefined) patch.contact_email = input.contact_email?.trim() || null
  if (input.contact_phone !== undefined) patch.contact_phone = input.contact_phone?.trim() || null
  if (input.party_status !== undefined) patch.party_status = input.party_status

  const { data, error } = await db
    .from('parties')
    .update(patch)
    .eq('id', partyId)
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  const party = mapPartyRow(data as PartyRow)
  const prev = existing as PartyRow

  await db.from('audit_logs').insert({
    action:
      input.party_status === 'Inactive' && prev.party_status !== 'Inactive'
        ? `Party dinonaktifkan — ${party.name}`
        : input.party_status === 'Active' && prev.party_status !== 'Active'
          ? `Party diaktifkan kembali — ${party.name}`
          : `Party diubah — ${party.name}`,
    action_type: input.party_status && input.party_status !== prev.party_status ? 'status' : 'update',
    party_id: partyId,
    actor_name: 'CMS',
    payload: {
      before: {
        name: prev.name,
        pic: prev.pic,
        npwp: prev.npwp ?? null,
        address: prev.address ?? null,
        party_type: prev.party_type ?? null,
        contact_email: prev.contact_email ?? null,
        contact_phone: prev.contact_phone ?? null,
        party_status: prev.party_status,
      },
      after: {
        name: party.name,
        pic: party.pic,
        npwp: party.npwp,
        address: party.address,
        party_type: party.party_type,
        contact_email: party.contact_email,
        contact_phone: party.contact_phone,
        party_status: party.party_status,
      },
    },
  })

  return party
}
