import 'server-only'

import type { ContractMetadata, DocumentStatus } from '@/types/cms'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { runRagflowExtractionPipeline } from '@/lib/ragflow/server'
import { getRagflowServerConfig } from '@/lib/server/env'

const ALLOWED_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]

const MAX_BYTES = 20 * 1024 * 1024

export function assertUploadFile(file: File) {
  if (file.size > MAX_BYTES) {
    throw new Error('File terlalu besar (maks 20 MB) — FR-CNT-SUP-003')
  }
  if (file.type && !ALLOWED_MIME.includes(file.type)) {
    throw new Error('Tipe file tidak didukung. Gunakan PDF atau DOCX.')
  }
}

export async function uploadContractFile(
  partyId: string,
  contractId: string,
  file: File,
): Promise<string> {
  const db = getSupabaseAdmin()
  const safeName = file.name.replace(/[^\w.\-()+ ]/g, '_')
  const storagePath = `${partyId}/${contractId}/${Date.now()}-${safeName}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await db.storage.from('contracts').upload(storagePath, buffer, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  })

  if (error) {
    throw new Error(`Storage upload gagal: ${error.message}`)
  }

  return storagePath
}

export async function persistContractDocument(input: {
  partyId: string
  contractId: string
  file: File
  storagePath: string
  ragflowDocId?: string
  ragflowDatasetId?: string
  status?: DocumentStatus
  category?: 'contract' | 'supporting' | 'termination' | 'amendment'
  description?: string
}) {
  const db = getSupabaseAdmin()
  const { datasetId } = getRagflowServerConfig()

  const { data, error } = await db
    .from('documents')
    .insert({
      party_id: input.partyId,
      contract_id: input.contractId,
      storage_path: input.storagePath,
      file_name: input.file.name,
      mime_type: input.file.type || null,
      status: input.status ?? 'extracted',
      ragflow_doc_id: input.ragflowDocId ?? null,
      ragflow_dataset_id: input.ragflowDatasetId ?? datasetId,
      document_category: input.category ?? 'contract',
      description: input.description ?? null,
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function extractAndPersistForContract(input: {
  partyId: string
  contractId: string
  file: File
  confirmedMetadata: ContractMetadata
  odooPartnerId?: number | null
}) {
  assertUploadFile(input.file)
  const storagePath = await uploadContractFile(input.partyId, input.contractId, input.file)

  let extracted: ContractMetadata = {}
  let ragflowDocId: string | undefined
  let ragflowDatasetId: string | undefined
  let docStatus: DocumentStatus = 'pending_extraction'
  let extractionError: string | null = null

  try {
    const pipeline = await runRagflowExtractionPipeline(input.file, input.file.name)
    extracted = pipeline.extracted.extracted
    ragflowDocId = pipeline.uploaded.docId
    ragflowDatasetId = pipeline.uploaded.datasetId
    docStatus = 'extracted'
  } catch (err) {
    extractionError = err instanceof Error ? err.message : 'RAGFlow extraction failed'
    docStatus = 'failed'
  }

  const doc = await persistContractDocument({
    partyId: input.partyId,
    contractId: input.contractId,
    file: input.file,
    storagePath,
    ragflowDocId,
    ragflowDatasetId,
    status: docStatus,
    category: 'contract',
  })

  return { doc, extracted, extractionError }
}

export async function persistSupportingDocument(input: {
  partyId: string
  contractId?: string | null
  file: File
  description?: string
  category?: 'supporting' | 'termination' | 'amendment'
}) {
  assertUploadFile(input.file)
  const db = getSupabaseAdmin()
  const contractSegment = input.contractId ?? 'party-level'
  const storagePath = await uploadContractFile(input.partyId, contractSegment, input.file)

  const { data, error } = await db
    .from('documents')
    .insert({
      party_id: input.partyId,
      contract_id: input.contractId ?? null,
      storage_path: storagePath,
      file_name: input.file.name,
      mime_type: input.file.type || null,
      status: 'confirmed',
      document_category: input.category ?? 'supporting',
      description: input.description ?? null,
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
}
