import 'server-only'

import { assertUploadFile } from '@/lib/documents/server'
import { buildDummyAiExtraction } from '@/lib/contracts/ai-intake-dummy'
import {
  classifyGuidelineCategory,
  evaluateGuidelines,
  type GuidelineAlert,
  type GuidelineCategory,
} from '@/lib/contracts/guidelines'
import { dummyOdooClient } from '@/lib/odoo/dummy'
import { searchOdooPartners } from '@/lib/odoo/server'
import type { OdooPartner } from '@/lib/odoo/types'
import { runRagflowExtractionPipeline } from '@/lib/ragflow/server'
import { mapPartyRow, type PartyRow } from '@/lib/parties/types'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import type { ContractMetadata, Party } from '@/types/cms'

export type AiIntakePreview = {
  mode: 'dummy' | 'live'
  fileName: string
  confidence: number | null
  rawTextPreview: string | null
  extracted: ContractMetadata
  suggestedCategory: GuidelineCategory
  guidelines: GuidelineAlert[]
  odooCandidates: OdooPartner[]
  party: Party | null
}

function ragflowIsLive() {
  return (
    process.env.RAGFLOW_MODE === 'live' ||
    process.env.NEXT_PUBLIC_RAGFLOW_MODE === 'live'
  )
}

function odooIsLive() {
  return process.env.ODOO_MODE === 'live' || process.env.NEXT_PUBLIC_ODOO_MODE === 'live'
}

async function searchPartnersSafe(name: string, limit = 5): Promise<OdooPartner[]> {
  const q = name.trim()
  if (!q) return []
  const domain: Array<[string, string, string]> = [['name', 'ilike', q]]

  if (!odooIsLive()) {
    return dummyOdooClient.searchPartners(domain, undefined, limit)
  }
  try {
    return await searchOdooPartners(domain, limit)
  } catch {
    return dummyOdooClient.searchPartners(domain, undefined, limit)
  }
}

async function partnerByIdSafe(id: number): Promise<OdooPartner | null> {
  if (!odooIsLive()) {
    const rows = await dummyOdooClient.searchPartners([['id', '=', id]], undefined, 1)
    return rows[0] ?? null
  }
  try {
    const rows = await searchOdooPartners([['id', '=', id]], 1)
    return rows[0] ?? null
  } catch {
    const rows = await dummyOdooClient.searchPartners([['id', '=', id]], undefined, 1)
    return rows[0] ?? null
  }
}

export async function previewContractAiIntake(input: {
  file: File
  partyId?: string | null
}): Promise<AiIntakePreview> {
  assertUploadFile(input.file)

  let party: Party | null = null
  if (input.partyId) {
    const db = getSupabaseAdmin()
    const { data } = await db.from('parties').select('*').eq('id', input.partyId).maybeSingle()
    if (data) party = mapPartyRow(data as PartyRow)
  }

  let extracted: ContractMetadata = {}
  let confidence: number | null = null
  let rawTextPreview: string | null = null
  let mode: 'dummy' | 'live' = 'dummy'
  let suggestedCategory: GuidelineCategory = 'Customer'

  if (ragflowIsLive()) {
    try {
      const pipeline = await runRagflowExtractionPipeline(input.file, input.file.name)
      extracted = pipeline.extracted.extracted
      confidence = pipeline.extracted.confidence ?? null
      rawTextPreview = pipeline.extracted.rawTextPreview ?? null
      mode = 'live'
      suggestedCategory = classifyGuidelineCategory({
        fileName: input.file.name,
        rawText: rawTextPreview ?? undefined,
        extracted,
      })
    } catch {
      const dummy = buildDummyAiExtraction(input.file.name, party?.name)
      extracted = dummy.extracted
      confidence = dummy.confidence ?? null
      rawTextPreview = dummy.rawTextPreview ?? null
      suggestedCategory = dummy.suggestedCategory
      mode = 'dummy'
    }
  } else {
    const dummy = buildDummyAiExtraction(input.file.name, party?.name)
    extracted = dummy.extracted
    confidence = dummy.confidence ?? null
    rawTextPreview = dummy.rawTextPreview ?? null
    suggestedCategory = dummy.suggestedCategory
    mode = 'dummy'
  }

  // Bias: if on Party Detail and customer pack, prefer current party name when empty
  if (!extracted.counterpartyName?.trim() && party?.name) {
    extracted = { ...extracted, counterpartyName: party.name }
  }

  const guidelines = evaluateGuidelines(suggestedCategory, {
    extracted,
    rawText: rawTextPreview ?? undefined,
  })

  let odooCandidates = await searchPartnersSafe(extracted.counterpartyName ?? '', 5)
  if (party?.odoo_partner_id != null && !odooCandidates.some((p) => p.id === party.odoo_partner_id)) {
    const linked = await partnerByIdSafe(party.odoo_partner_id)
    if (linked) odooCandidates = [linked, ...odooCandidates]
  }
  // Demo fallback: if name search empty, surface a known dummy partner for Customer pack
  if (!odooCandidates.length && suggestedCategory === 'Customer') {
    const fallback = await partnerByIdSafe(101)
    if (fallback) odooCandidates = [fallback]
  }

  return {
    mode,
    fileName: input.file.name,
    confidence,
    rawTextPreview,
    extracted,
    suggestedCategory,
    guidelines,
    odooCandidates,
    party,
  }
}
