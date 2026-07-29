'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AUTH_MODE } from '@/lib/auth/mode'
import { sessionUserFromSupabase, signOutSupabase } from '@/lib/auth/client'
import {
  clearServerSession,
  persistMockSession,
  persistSupabaseSession,
} from '@/lib/auth/client-session'
import { getSupabaseBrowser, isSupabaseBrowserConfigured } from '@/lib/supabase/client'
import type { SessionUser } from '@/lib/roles'

type AuthContextValue = {
  user: SessionUser | null
  login: (user: SessionUser) => Promise<void>
  logout: () => void
  ready: boolean
  authMode: typeof AUTH_MODE
}

const AuthContext = createContext<AuthContextValue | null>(null)
const STORAGE_KEY = 'cms.session'
const SUPABASE_BOOT_MS = 8000

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    promise.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      },
    )
  })
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function bootSupabase() {
      const supabase = getSupabaseBrowser()
      try {
        const { data } = await withTimeout(
          supabase.auth.getSession(),
          SUPABASE_BOOT_MS,
          'Auth getSession',
        )
        const session = data.session
        if (session?.user && !cancelled) {
          const next = await sessionUserFromSupabase(
            session.user.id,
            session.user.email ?? '',
          )
          if (!cancelled) {
            setUser(next)
            if (session.access_token) {
              await persistSupabaseSession(session.access_token)
            }
          }
        }
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setReady(true)
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (cancelled) return
        if (session?.user) {
          try {
            const next = await sessionUserFromSupabase(
              session.user.id,
              session.user.email ?? '',
            )
            setUser(next)
            if (session.access_token) {
              await persistSupabaseSession(session.access_token)
            }
          } catch {
            setUser(null)
          }
        } else {
          setUser(null)
          void clearServerSession()
        }
      })

      return () => subscription.unsubscribe()
    }

    async function bootMock() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as SessionUser
          if (!cancelled) setUser(parsed)
          // Cookie harus ada sebelum navigasi protected route (hindari loop overlay)
          await persistMockSession(parsed)
        }
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setReady(true)
      }
    }

    let unsub: (() => void) | undefined

    if (AUTH_MODE === 'supabase' && isSupabaseBrowserConfigured()) {
      void bootSupabase().then((cleanup) => {
        unsub = cleanup
      })
    } else {
      void bootMock()
    }

    return () => {
      cancelled = true
      unsub?.()
    }
  }, [])

  const login = useCallback(async (next: SessionUser) => {
    setUser(next)
    if (AUTH_MODE === 'mock') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      await persistMockSession(next)
    }
  }, [])

  const logout = useCallback(() => {
    if (AUTH_MODE === 'supabase' && isSupabaseBrowserConfigured()) {
      void signOutSupabase()
    }
    void clearServerSession()
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      authMode: AUTH_MODE,
      login,
      logout,
    }),
    [user, ready, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
