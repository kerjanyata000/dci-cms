import type { Contract } from '@/types/cms'

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
}

export async function createContract(partyId: string, input: CreateContractInput): Promise<Contract> {
  const data = await parseJson<{ contract: Contract }>(
    await fetch(`/api/parties/${partyId}/contracts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  )
  return data.contract
}
