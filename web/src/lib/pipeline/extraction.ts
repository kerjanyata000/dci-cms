import type { ContractMetadata, ValidationStatus } from '../../types/cms'
import { searchPartnersFromApi } from '../odoo/api'
import { runExtractionFromApi } from '../ragflow/api'
import { RAGFLOW_DATASET_ID } from '../ragflow/client'
import { validateContractMetadata } from '../validation/metadata'

export type ExtractionPipelineResult = {
  ragflowDocId: string
  extracted: ContractMetadata
  confidence?: number
  validationStatus: ValidationStatus
  validationIssues: ReturnType<typeof validateContractMetadata>['issues']
}

/** Upload → extract → validate (Odoo/RAGFlow via server API when mode=live). */
export async function runExtractionPipeline(input: {
  file: File
  confirmed?: ContractMetadata
  odooPartnerId?: number
}): Promise<ExtractionPipelineResult> {
  const { uploaded, extracted } = await runExtractionFromApi(input.file, RAGFLOW_DATASET_ID)
  const confirmed = input.confirmed ?? extracted.extracted

  let partner = null
  if (input.odooPartnerId != null) {
    const partners = await searchPartnersFromApi([['id', '=', input.odooPartnerId]], 1)
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
