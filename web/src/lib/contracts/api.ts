import type { Contract, ContractAmendment, ContractTermination, DocumentRow } from '@/types/cms'

async function parseJson<T>(res: Response): Promise<T> {
  const payload = (await res.json()) as { ok?: boolean; data?: T; error?: string }
  if (!res.ok || !payload.ok) {
    throw new Error(payload.error ?? `Request failed (${res.status})`)
  }
  return payload.data as T
}

export type CreateContractInput = {
  contract_title: string
  doc_type?: string
  agreement_no?: string
  agreement_date?: string
  duration_months?: number
  contract_value?: string
  owner?: string
  department?: string
  remarks?: string
  save_mode?: 'draft' | 'review'
  file?: File | null
}

export async function createContract(partyId: string, input: CreateContractInput): Promise<Contract> {
  if (input.file) {
    const form = new FormData()
    form.set('contract_title', input.contract_title)
    if (input.doc_type) form.set('doc_type', input.doc_type)
    if (input.agreement_no) form.set('agreement_no', input.agreement_no)
    if (input.agreement_date) form.set('agreement_date', input.agreement_date)
    if (input.duration_months != null) form.set('duration_months', String(input.duration_months))
    if (input.contract_value) form.set('contract_value', input.contract_value)
    if (input.owner) form.set('owner', input.owner)
    if (input.department) form.set('department', input.department)
    if (input.remarks) form.set('remarks', input.remarks)
    form.set('save_mode', input.save_mode ?? 'draft')
    form.set('file', input.file)

    const data = await parseJson<{ contract: Contract }>(
      await fetch(`/api/parties/${partyId}/contracts`, { method: 'POST', body: form }),
    )
    return data.contract
  }

  const data = await parseJson<{ contract: Contract }>(
    await fetch(`/api/parties/${partyId}/contracts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  )
  return data.contract
}

export type CreateAmendmentInput = {
  title: string
  change_category?: string
  effective_date?: string
  reason?: string
  summary?: string
  doc_type?: string
}

export async function createAmendment(contractId: string, input: CreateAmendmentInput) {
  const data = await parseJson<{ amendment: ContractAmendment }>(
    await fetch(`/api/contracts/${contractId}/amendments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  )
  return data.amendment
}

export type CreateTerminationInput = {
  termination_type?: string
  effective_date: string
  reason?: string
  summary?: string
}

export async function createTermination(contractId: string, input: CreateTerminationInput) {
  const data = await parseJson<{ termination: ContractTermination }>(
    await fetch(`/api/contracts/${contractId}/terminations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  )
  return data.termination
}

export async function uploadSupportingDocument(
  partyId: string,
  input: { file: File; description?: string; contract_id?: string },
) {
  const form = new FormData()
  form.set('file', input.file)
  if (input.description) form.set('description', input.description)
  if (input.contract_id) form.set('contract_id', input.contract_id)
  form.set('category', 'supporting')

  const data = await parseJson<{ document: DocumentRow }>(
    await fetch(`/api/parties/${partyId}/documents`, { method: 'POST', body: form }),
  )
  return data.document
}
