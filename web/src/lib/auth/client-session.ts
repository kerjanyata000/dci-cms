import type { SessionUser } from '@/lib/roles'
import { cmsFetch } from '@/lib/api/http'
import { getSupabaseBrowser } from '@/lib/supabase/client'

export async function persistMockSession(user: SessionUser) {
  await cmsFetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user }),
  })
}

export async function persistSupabaseSession(accessToken: string) {
  await cmsFetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken }),
  })
}

export async function clearServerSession() {
  await cmsFetch('/api/auth/session', { method: 'DELETE' })
}

export async function syncSupabaseSessionFromClient() {
  const supabase = getSupabaseBrowser()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (token) await persistSupabaseSession(token)
}
