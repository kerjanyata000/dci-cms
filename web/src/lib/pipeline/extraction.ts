import type { ContractMetadata, ValidationStatus } from '../../types/cms'
import { getOdooClient } from '../odoo/client'
import { getRagflowClient, RAGFLOW_DATASET_ID } from '../ragflow/client'
import { validateContractMetadata } from '../validation/metadata'

export type ExtractionPipelineResult = {
  ragflowDocId: string
  extracted: ContractMetadata
  confidence?: number
  validationStatus: ValidationStatus
  validationIssues: ReturnType<typeof validateContractMetadata>['issues']
}

/**
 * Happy-path orchestration for Add Contract (browser uses dummy clients).
 * Live keys must move to Edge Functions later.
 */
export async function runExtractionPipeline(input: {
  file: File
  confirmed?: ContractMetadata
  odooPartnerId?: number
}): Promise<ExtractionPipelineResult> {
  const ragflow = getRagflowClient()
  const odoo = getOdooClient()

  const uploaded = await ragflow.uploadDocument(RAGFLOW_DATASET_ID, input.file, input.file.name)
  const extracted = await ragflow.extractMetadata(uploaded.docId)
  const confirmed = input.confirmed ?? extracted.extracted

  let partner = null
  if (input.odooPartnerId != null) {
    const partners = await odoo.searchPartners([['id', '=', input.odooPartnerId]], undefined, 1)
    partner = partners[0] ?? null
  }

  const validation = validateContractMetadata({
    extracted: extracted.extracted,
    confirmed,
    partner,
    confidence: extracted.confidence,
  })

  return {
    ragflowDocId: uploaded.docId,
    extracted: extracted.extracted,
    confidence: extracted.confidence,
    validationStatus: validation.status,
    validationIssues: validation.issues,
  }
}
