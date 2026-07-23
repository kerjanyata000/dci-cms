import { cmsFetch } from '@/lib/api/http'
import type { DashboardPayload } from '@/lib/dashboard/config'

async function parseJson<T>(res: Response): Promise<T> {
  const payload = (await res.json()) as { ok?: boolean; data?: T; error?: string }
  if (!res.ok || !payload.ok) {
    throw new Error(payload.error ?? `Request failed (${res.status})`)
  }
  return payload.data as T
}

export async function fetchDashboard(): Promise<DashboardPayload> {
  return parseJson<DashboardPayload>(await cmsFetch('/api/dashboard'))
}
