import { cmsFetch } from '@/lib/api/http'
import type { SmartSearchResult, SearchScope } from '@/lib/search/server'

async function parseJson<T>(res: Response): Promise<T> {
  const payload = (await res.json()) as { ok?: boolean; data?: T; error?: string }
  if (!res.ok || !payload.ok) {
    throw new Error(payload.error ?? `Request failed (${res.status})`)
  }
  return payload.data as T
}

export type SearchParams = {
  q: string
  scope?: SearchScope
  status?: string
  docType?: string
  semantic?: boolean
}

export async function runSearch(params: SearchParams): Promise<SmartSearchResult> {
  const sp = new URLSearchParams()
  sp.set('q', params.q)
  if (params.scope) sp.set('scope', params.scope)
  if (params.status) sp.set('status', params.status)
  if (params.docType) sp.set('docType', params.docType)
  if (params.semantic === false) sp.set('semantic', '0')

  return parseJson<SmartSearchResult>(await cmsFetch(`/api/search?${sp.toString()}`, { cache: 'no-store' }))
}
