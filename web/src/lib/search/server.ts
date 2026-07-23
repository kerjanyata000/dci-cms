import 'server-only'

import { mapContractRow, type ContractRow } from '@/lib/contracts/types'
import { mapPartyRow, type PartyRow } from '@/lib/parties/types'
import { retrieveRagflowChunks } from '@/lib/ragflow/server'
import type { RagflowSearchHit } from '@/lib/ragflow/types'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import type { Contract, Party } from '@/types/cms'

export type SearchScope = 'all' | 'parties' | 'contracts' | 'content'

export type ContentSearchHit = RagflowSearchHit & {
  document_id: string | null
  contract_id: string | null
  party_id: string | null
  contract_code: string | null
  party_name: string | null
  file_name: string | null
  displayContent?: string
}

export type SmartSearchResult = {
  query: string
  scope: SearchScope
  parties: Party[]
  contracts: Array<Contract & { party_name: string; party_code: string }>
  contentHits: ContentSearchHit[]
  semanticUsed: boolean
  semanticError: string | null
}

function ilike(term: string) {
  return `%${term}%`
}

export async function runSmartSearch(params: {
  q: string
  scope?: SearchScope
  status?: string
  docType?: string
  semantic?: boolean
}): Promise<SmartSearchResult> {
  const query = params.q.trim()
  const scope = params.scope ?? 'all'
  const db = getSupabaseAdmin()

  const result: SmartSearchResult = {
    query,
    scope,
    parties: [],
    contracts: [],
    contentHits: [],
    semanticUsed: false,
    semanticError: null,
  }

  if (!query) return result

  const pattern = ilike(query)

  if (scope === 'all' || scope === 'parties') {
    const { data, error } = await db
      .from('parties')
      .select('*')
      .or(`name.ilike.${pattern},pic.ilike.${pattern},party_code.ilike.${pattern}`)
      .order('name', { ascending: true })
      .limit(50)

    if (error) throw new Error(error.message)
    result.parties = (data as PartyRow[]).map(mapPartyRow)
  }

  if (scope === 'all' || scope === 'contracts') {
    let contractQuery = db
      .from('contracts')
      .select('*, parties(name, party_code)')
      .or(
        [
          `contract_code.ilike.${pattern}`,
          `contract_title.ilike.${pattern}`,
          `agreement_no.ilike.${pattern}`,
          `doc_type.ilike.${pattern}`,
          `status_text.ilike.${pattern}`,
          `owner.ilike.${pattern}`,
          `department.ilike.${pattern}`,
          `remarks.ilike.${pattern}`,
        ].join(','),
      )
      .order('updated_at', { ascending: false })
      .limit(50)

    if (params.status?.trim()) {
      contractQuery = contractQuery.eq('status', params.status.trim())
    }
    if (params.docType?.trim()) {
      contractQuery = contractQuery.ilike('doc_type', ilike(params.docType.trim()))
    }

    const { data, error } = await contractQuery
    if (error) throw new Error(error.message)

    result.contracts = (data ?? []).map((row) => {
      const party = row.parties as { name: string; party_code: string } | null
      const contract = mapContractRow(row as ContractRow)
      return {
        ...contract,
        party_name: party?.name ?? '—',
        party_code: party?.party_code ?? '—',
      }
    })
  }

  if ((scope === 'all' || scope === 'content') && params.semantic !== false && query.length >= 3) {
    result.semanticUsed = true
    try {
      const hits = await retrieveRagflowChunks(query, {
        topK: 8,
        cmsOnly: true,
        similarityThreshold: 0.35,
      })
      if (hits.length) {
        const docIds = [...new Set(hits.map((h) => h.docId))]
        const { data: docs } = await db
          .from('documents')
          .select('id, ragflow_doc_id, contract_id, party_id, file_name')
          .in('ragflow_doc_id', docIds)

        const docByRagId = new Map(
          (docs ?? []).map((d) => [d.ragflow_doc_id as string, d]),
        )

        const contractIds = [
          ...new Set((docs ?? []).map((d) => d.contract_id).filter(Boolean)),
        ] as string[]
        const partyIds = [
          ...new Set((docs ?? []).map((d) => d.party_id).filter(Boolean)),
        ] as string[]

        const [contractsRes, partiesRes] = await Promise.all([
          contractIds.length
            ? db.from('contracts').select('id, contract_code, party_id').in('id', contractIds)
            : Promise.resolve({ data: [] }),
          partyIds.length
            ? db.from('parties').select('id, name').in('id', partyIds)
            : Promise.resolve({ data: [] }),
        ])

        const contractMap = new Map(
          (contractsRes.data ?? []).map((c) => [c.id as string, c]),
        )
        const partyMap = new Map((partiesRes.data ?? []).map((p) => [p.id as string, p]))

        result.contentHits = hits.map((hit) => {
          const doc = docByRagId.get(hit.docId)
          const contract = doc?.contract_id ? contractMap.get(doc.contract_id) : null
          const partyId = (doc?.party_id ?? contract?.party_id) as string | undefined
          const party = partyId ? partyMap.get(partyId) : null
          return {
            ...hit,
            document_id: doc?.id ?? null,
            contract_id: doc?.contract_id ?? null,
            party_id: partyId ?? null,
            contract_code: (contract?.contract_code as string) ?? null,
            party_name: (party?.name as string) ?? null,
            file_name: doc?.file_name ?? hit.fileName ?? null,
            displayContent: hit.displayContent,
          }
        })
      }
    } catch (err) {
      result.semanticError = err instanceof Error ? err.message : 'Semantic search failed'
    }
  }

  return result
}
