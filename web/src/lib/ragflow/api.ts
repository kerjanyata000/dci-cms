import type {
  RagflowExtractResult,
  RagflowSearchHit,
  RagflowUploadResult,
} from './types'
import { RAGFLOW_MODE } from './client'
import { dummyRagflowClient } from './dummy'

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const payload = (await res.json()) as { ok?: boolean; data?: T; error?: string }
  if (!res.ok || !payload.ok) {
    throw new Error(payload.error ?? `Request failed (${res.status})`)
  }
  return payload.data as T
}

export async function uploadDocumentFromApi(
  datasetId: string,
  file: File | Blob,
  fileName: string,
): Promise<RagflowUploadResult> {
  if (RAGFLOW_MODE !== 'live') {
    return dummyRagflowClient.uploadDocument(datasetId, file, fileName)
  }

  const form = new FormData()
  form.append('file', file, fileName)
  form.append('datasetId', datasetId)

  const res = await fetch('/api/ragflow/upload', { method: 'POST', body: form })
  const payload = (await res.json()) as {
    ok?: boolean
    data?: RagflowUploadResult
    error?: string
  }
  if (!res.ok || !payload.ok) {
    throw new Error(payload.error ?? `Upload failed (${res.status})`)
  }
  return payload.data as RagflowUploadResult
}

export async function extractMetadataFromApi(
  docId: string,
  datasetId?: string,
): Promise<RagflowExtractResult> {
  if (RAGFLOW_MODE !== 'live') {
    return dummyRagflowClient.extractMetadata(docId)
  }
  const data = await postJson<{ result: RagflowExtractResult }>('/api/ragflow/extract', {
    docId,
    datasetId,
  })
  return data.result
}

export async function runExtractionFromApi(
  file: File,
  datasetId: string,
): Promise<{ uploaded: RagflowUploadResult; extracted: RagflowExtractResult }> {
  if (RAGFLOW_MODE !== 'live') {
    const uploaded = await dummyRagflowClient.uploadDocument(datasetId, file, file.name)
    const extracted = await dummyRagflowClient.extractMetadata(uploaded.docId)
    return { uploaded, extracted }
  }

  const form = new FormData()
  form.append('file', file)
  form.append('datasetId', datasetId)

  const res = await fetch('/api/ragflow/extract', { method: 'POST', body: form })
  const payload = (await res.json()) as {
    ok?: boolean
    data?: { uploaded: RagflowUploadResult; extracted: RagflowExtractResult }
    error?: string
  }
  if (!res.ok || !payload.ok) {
    throw new Error(payload.error ?? `Extract failed (${res.status})`)
  }
  return payload.data as { uploaded: RagflowUploadResult; extracted: RagflowExtractResult }
}

export async function retrieveFromApi(
  datasetId: string,
  query: string,
  options?: {
    topK?: number
    cmsOnly?: boolean
    similarityThreshold?: number
  },
): Promise<RagflowSearchHit[]> {
  if (RAGFLOW_MODE !== 'live') {
    return dummyRagflowClient.retrieve(datasetId, query, options?.topK ?? 5)
  }
  const data = await postJson<{ hits: RagflowSearchHit[] }>('/api/ragflow/retrieve', {
    datasetId,
    query,
    topK: options?.topK ?? 5,
    cmsOnly: options?.cmsOnly,
    similarityThreshold: options?.similarityThreshold,
  })
  return data.hits
}

export async function checkRagflowHealthFromApi() {
  const res = await fetch('/api/ragflow/health', { cache: 'no-store' })
  return res.json()
}
