import type { ContractMetadata } from '../../types/cms'

export type RagflowDocumentStatus = 'pending' | 'parsing' | 'finished' | 'failed'

export type RagflowUploadResult = {
  datasetId: string
  docId: string
  status: RagflowDocumentStatus
}

export type RagflowExtractResult = {
  docId: string
  status: RagflowDocumentStatus
  /** Structured fields mapped to BRD contract metadata */
  extracted: ContractMetadata
  confidence?: number
  rawTextPreview?: string
}

export type RagflowSearchHit = {
  docId: string
  content: string
  score: number
  displayContent?: string
  fileName?: string | null
  cmsLinked?: boolean
  metadata?: Record<string, unknown>
}

export type RagflowRetrieveOptions = {
  datasetId?: string
  topK?: number
  documentIds?: string[]
  cmsOnly?: boolean
  similarityThreshold?: number
}

export interface RagflowClient {
  /** Upload file into dataset for parse → chunk → embed */
  uploadDocument(datasetId: string, file: File | Blob, fileName: string): Promise<RagflowUploadResult>
  /** Poll / fetch structured extraction mapped to CMS fields */
  extractMetadata(docId: string): Promise<RagflowExtractResult>
  /** Semantic retrieve for smart search (RBAC filter applied in CMS) */
  retrieve(datasetId: string, query: string, topK?: number): Promise<RagflowSearchHit[]>
}
