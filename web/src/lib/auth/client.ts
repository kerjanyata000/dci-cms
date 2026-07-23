import type { AppRole, SessionUser } from '@/lib/roles'
import { getSupabaseBrowser } from '@/lib/supabase/client'

export async function sessionUserFromSupabase(userId: string, email: string): Promise<SessionUser> {
  const supabase = getSupabaseBrowser()
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)

  const role = (data?.role as AppRole | undefined) ?? 'business'
  const fallbackName = email
    .split('@')[0]
    .replace(/[.\-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

  return {
    name: data?.full_name?.trim() || fallbackName,
    role,
  }
}

export async function signInWithSupabase(email: string, password: string): Promise<SessionUser> {
  const supabase = getSupabaseBrowser()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  if (error) throw new Error(error.message)
  if (!data.user) throw new Error('Login gagal — user tidak ditemukan')

  return sessionUserFromSupabase(data.user.id, data.user.email ?? email)
}

export async function signOutSupabase() {
  const supabase = getSupabaseBrowser()
  await supabase.auth.signOut()
}
