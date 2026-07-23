import 'server-only'

import { extractContractFieldsFromText } from './extract-fields'
import { getCmsRagflowDocumentIds, mapCmsDocumentNames } from './cms-docs'
import { stripHtmlForDisplay } from './text'
import type {
  RagflowDocumentStatus,
  RagflowExtractResult,
  RagflowRetrieveOptions,
  RagflowSearchHit,
  RagflowUploadResult,
} from './types'
import { getRagflowServerConfig } from '../server/env'

type RagflowEnvelope<T> = {
  code?: number
  message?: string
  data?: T
}

async function ragflowRequest(path: string, init?: RequestInit): Promise<Response> {
  const { url, apiKey } = getRagflowServerConfig()
  return fetch(`${url}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })
}

/** Standard RAGFlow API envelope: { code: 0, data: ... } */
async function ragflowFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await ragflowRequest(path, init)
  const payload = (await response.json()) as RagflowEnvelope<T>

  if (!response.ok) {
    throw new Error(payload.message ?? `RAGFlow HTTP ${response.status}`)
  }
  if (payload.code != null && payload.code !== 0) {
    throw new Error(payload.message ?? `RAGFlow error code ${payload.code}`)
  }

  return payload.data as T
}

/** healthz returns plain JSON without code wrapper: { status: "ok", db: "ok", ... } */
async function ragflowHealthFetch(): Promise<Record<string, string>> {
  const response = await ragflowRequest('/api/v1/system/healthz')
  const payload = (await response.json()) as Record<string, string> & RagflowEnvelope<unknown>

  if (!response.ok) {
    throw new Error(`RAGFlow health HTTP ${response.status}`)
  }
  if (payload.code != null && payload.code !== 0) {
    throw new Error(payload.message ?? `RAGFlow health error code ${payload.code}`)
  }

  return payload
}

function normalizeDatasetList(
  data: Array<{ id: string; name: string; document_count?: number }> | undefined,
): Array<{ id: string; name: string; document_count?: number }> {
  return data ?? []
}

export async function ragflowHealthCheck() {
  const { url, datasetId } = getRagflowServerConfig()
  const health = await ragflowHealthFetch()
  const raw = await ragflowFetch<
    Array<{ id: string; name: string; document_count?: number }>
  >('/api/v1/datasets?page=1&page_size=50')
  const datasets = normalizeDatasetList(raw)

  return {
    url,
    datasetId,
    health,
    datasets,
  }
}

export async function uploadRagflowDocument(
  file: File | Blob,
  fileName: string,
  datasetId?: string,
): Promise<RagflowUploadResult> {
  const { datasetId: defaultDatasetId } = getRagflowServerConfig()
  const ds = datasetId ?? defaultDatasetId

  const form = new FormData()
  form.append('file', file, fileName)

  const data = await ragflowFetch<
    Array<{ id: string; run?: string; dataset_id?: string }>
  >(`/api/v1/datasets/${ds}/documents`, {
    method: 'POST',
    body: form,
  })

  const doc = data[0]
  if (!doc?.id) throw new Error('RAGFlow upload returned no document id')

  return {
    datasetId: ds,
    docId: doc.id,
    status: mapRunStatus(doc.run),
  }
}

function mapRunStatus(run?: string): RagflowDocumentStatus {
  if (run === 'DONE') return 'finished'
  if (run === 'FAIL') return 'failed'
  if (run === 'RUNNING') return 'parsing'
  return 'pending'
}

export async function parseRagflowDocument(datasetId: string, docId: string) {
  await ragflowFetch<unknown>(`/api/v1/datasets/${datasetId}/chunks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_ids: [docId] }),
  })
}

async function waitForDocumentParsed(datasetId: string, docId: string, timeoutMs = 120_000) {
  const started = Date.now()

  while (Date.now() - started < timeoutMs) {
    const data = await ragflowFetch<{ docs?: Array<{ id: string; run?: string }> }>(
      `/api/v1/datasets/${datasetId}/documents?id=${docId}&page=1&page_size=1`,
    )
    const doc = data.docs?.[0]
    const run = doc?.run

    if (run === 'DONE') return
    if (run === 'FAIL' || run === 'CANCEL') {
      throw new Error(`RAGFlow parsing failed (${run ?? 'unknown'})`)
    }

    await new Promise((r) => setTimeout(r, 2500))
  }

  throw new Error('RAGFlow parsing timed out')
}

async function getDocumentChunkText(datasetId: string, docId: string, limit = 12) {
  const data = await ragflowFetch<{
    chunks?: Array<{ content?: string; similarity?: number }>
  }>(
    `/api/v1/datasets/${datasetId}/documents/${docId}/chunks?page=1&page_size=${limit}`,
  )

  return (data.chunks ?? [])
    .map((c) => c.content?.trim())
    .filter(Boolean)
    .join('\n\n')
}

export async function extractRagflowMetadata(
  docId: string,
  datasetId?: string,
): Promise<RagflowExtractResult> {
  const { datasetId: defaultDatasetId } = getRagflowServerConfig()
  const ds = datasetId ?? defaultDatasetId

  await parseRagflowDocument(ds, docId)
  await waitForDocumentParsed(ds, docId)

  const text = await getDocumentChunkText(ds, docId)
  const extracted = extractContractFieldsFromText(text)

  return {
    docId,
    status: 'finished',
    confidence: text.length > 200 ? 0.72 : 0.45,
    rawTextPreview: text.slice(0, 1200),
    extracted,
  }
}

export async function retrieveRagflowChunks(
  question: string,
  options: RagflowRetrieveOptions = {},
): Promise<RagflowSearchHit[]> {
  const { datasetId: defaultDatasetId } = getRagflowServerConfig()
  const ds = options.datasetId ?? defaultDatasetId
  const topK = options.topK ?? 5
  const similarityThreshold = options.similarityThreshold ?? 0.35

  let documentIds = options.documentIds
  if (options.cmsOnly && !documentIds?.length) {
    documentIds = await getCmsRagflowDocumentIds()
    if (!documentIds.length) return []
  }

  const body: Record<string, unknown> = {
    question,
    dataset_ids: [ds],
    page: 1,
    page_size: topK,
    similarity_threshold: similarityThreshold,
  }

  if (documentIds?.length) {
    body.document_ids = documentIds
  }

  const data = await ragflowFetch<{
    chunks?: Array<{
      id?: string
      document_id?: string
      content?: string
      similarity?: number
      vector_similarity?: number
    }>
  }>('/api/v1/retrieval', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const rawHits = (data.chunks ?? []).map((c) => ({
    docId: c.document_id ?? c.id ?? 'unknown',
    content: c.content ?? '',
    score: c.similarity ?? c.vector_similarity ?? 0,
  }))

  const filtered = documentIds?.length
    ? rawHits
    : rawHits.filter((h) => h.score >= similarityThreshold)

  const nameMap = await mapCmsDocumentNames(filtered.map((h) => h.docId))

  return filtered.map((hit) => {
    const fileName = nameMap.get(hit.docId) ?? null
    return {
      ...hit,
      fileName,
      cmsLinked: Boolean(fileName),
      displayContent: stripHtmlForDisplay(hit.content),
    }
  })
}

export async function runRagflowExtractionPipeline(
  file: File | Blob,
  fileName: string,
  datasetId?: string,
) {
  const uploaded = await uploadRagflowDocument(file, fileName, datasetId)
  const extracted = await extractRagflowMetadata(uploaded.docId, uploaded.datasetId)
  return { uploaded, extracted }
}
