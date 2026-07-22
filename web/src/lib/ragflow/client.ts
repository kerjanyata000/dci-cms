import type { RagflowClient } from './types'
import { dummyRagflowClient } from './dummy'

export type RagflowMode = 'dummy' | 'live'

export const RAGFLOW_MODE: RagflowMode =
  (import.meta.env.VITE_RAGFLOW_MODE as RagflowMode | undefined) ?? 'dummy'

export const RAGFLOW_DATASET_ID =
  import.meta.env.VITE_RAGFLOW_DATASET_ID ?? 'cms-contracts'

/**
 * Live RAGFlow calls belong on the server (Edge Function) with API key.
 * Browser uses dummy mode for UI development.
 */
const liveRagflowClient: RagflowClient = {
  async uploadDocument() {
    throw new Error(
      'RAGFlow live client must run on the server (Supabase Edge Function). Use VITE_RAGFLOW_MODE=dummy in the browser.',
    )
  },
  async extractMetadata() {
    throw new Error(
      'RAGFlow live client must run on the server (Supabase Edge Function). Use VITE_RAGFLOW_MODE=dummy in the browser.',
    )
  },
  async retrieve() {
    throw new Error(
      'RAGFlow live client must run on the server (Supabase Edge Function). Use VITE_RAGFLOW_MODE=dummy in the browser.',
    )
  },
}

export function getRagflowClient(): RagflowClient {
  return RAGFLOW_MODE === 'live' ? liveRagflowClient : dummyRagflowClient
}

export type {
  RagflowClient,
  RagflowExtractResult,
  RagflowSearchHit,
  RagflowUploadResult,
} from './types'
