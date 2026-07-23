import type { SaleOrderRow } from '@/types/cms'

async function parseJson<T>(res: Response): Promise<T> {
  const payload = (await res.json()) as { ok?: boolean; data?: T; error?: string }
  if (!res.ok || !payload.ok) {
    throw new Error(payload.error ?? `Request failed (${res.status})`)
  }
  return payload.data as T
}

export type SyncSoResult = {
  partiesProcessed: number
  ordersUpserted: number
  syncedAt: string
  errors: string[]
}

export type SyncedOrderRow = SaleOrderRow & {
  parties?: { party_code: string; name: string } | null
}

export async function fetchSyncedOrders(partyId?: string): Promise<SyncedOrderRow[]> {
  const qs = partyId ? `?partyId=${encodeURIComponent(partyId)}` : ''
  const data = await parseJson<{ orders: SyncedOrderRow[] }>(await fetch(`/api/so${qs}`))
  return data.orders
}

export async function runSoSync(partyId?: string): Promise<SyncSoResult> {
  return parseJson<SyncSoResult>(
    await fetch('/api/so', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partyId ? { partyId } : {}),
    }),
  )
}
