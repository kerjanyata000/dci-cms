import 'server-only'

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { mapPartyRow, type PartyRow } from '@/lib/parties/types'

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
