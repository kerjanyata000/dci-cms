import 'server-only'

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { todayIso } from '@/lib/time'

function todayIsoDate() {
  return todayIso()
}

/**
 * Apply due lifecycle updates for a party (or all parties if partyId omitted).
 * - Termination scheduled with effective_date <= today → contract Terminated
 * - Active/Fully Signed with expiry_date < today → Expired
 */
export async function applyDueLifecycleUpdates(partyId?: string) {
  const db = getSupabaseAdmin()
  const today = todayIsoDate()
  let updated = 0

  let termQuery = db
    .from('contract_terminations')
    .select('id, contract_id, party_id, effective_date, status')
    .eq('status', 'scheduled')
    .lte('effective_date', today)

  if (partyId) termQuery = termQuery.eq('party_id', partyId)

  const { data: dueTerms, error: termError } = await termQuery
  if (termError) throw new Error(termError.message)

  for (const term of dueTerms ?? []) {
    const { data: contract } = await db
      .from('contracts')
      .select('id, status, contract_code')
      .eq('id', term.contract_id)
      .single()

    if (!contract || contract.status === 'terminated') {
      await db
        .from('contract_terminations')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', term.id)
      continue
    }

    await db
      .from('contracts')
      .update({
        status: 'terminated',
        status_text: 'Terminated',
        updated_at: new Date().toISOString(),
      })
      .eq('id', term.contract_id)

    await db
      .from('contract_terminations')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', term.id)

    await db.from('audit_logs').insert({
      action: `Termination efektif — ${contract.contract_code} (effective ${term.effective_date})`,
      action_type: 'termination',
      party_id: term.party_id,
      contract_id: term.contract_id,
      actor_name: 'CMS',
      payload: { effective_date: term.effective_date, source: 'lifecycle_due' },
    })
    updated += 1
  }

  let expiryQuery = db
    .from('contracts')
    .select('id, party_id, contract_code, expiry_date, status')
    .in('status', ['active', 'fully_signed', 'signed'])
    .not('expiry_date', 'is', null)
    .lt('expiry_date', today)

  if (partyId) expiryQuery = expiryQuery.eq('party_id', partyId)

  const { data: expired, error: expiryError } = await expiryQuery
  if (expiryError) throw new Error(expiryError.message)

  for (const contract of expired ?? []) {
    await db
      .from('contracts')
      .update({
        status: 'expired',
        status_text: 'Expired',
        updated_at: new Date().toISOString(),
      })
      .eq('id', contract.id)

    await db.from('audit_logs').insert({
      action: `Kontrak expired — ${contract.contract_code} (expiry ${contract.expiry_date})`,
      action_type: 'status',
      party_id: contract.party_id,
      contract_id: contract.id,
      actor_name: 'CMS',
      payload: { expiry_date: contract.expiry_date, source: 'lifecycle_due' },
    })
    updated += 1
  }

  return { updated, asOf: today }
}
