'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { AUTH_MODE } from '@/lib/auth/mode'
import { sessionUserFromSupabase, signOutSupabase } from '@/lib/auth/client'
import { getSupabaseBrowser, isSupabaseBrowserConfigured } from '@/lib/supabase/client'
import type { SessionUser } from '@/lib/roles'

type AuthContextValue = {
  user: SessionUser | null
  login: (user: SessionUser) => void
  logout: () => void
  ready: boolean
  authMode: typeof AUTH_MODE
}

const AuthContext = createContext<AuthContextValue | null>(null)
const STORAGE_KEY = 'cms.session'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (AUTH_MODE === 'supabase' && isSupabaseBrowserConfigured()) {
      const supabase = getSupabaseBrowser()

      void supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          try {
            setUser(
              await sessionUserFromSupabase(session.user.id, session.user.email ?? ''),
            )
          } catch {
            setUser(null)
          }
        }
        setReady(true)
      })

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          try {
            setUser(
              await sessionUserFromSupabase(session.user.id, session.user.email ?? ''),
            )
          } catch {
            setUser(null)
          }
        } else {
          setUser(null)
        }
      })

      return () => subscription.unsubscribe()
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setUser(JSON.parse(raw) as SessionUser)
    } catch {
      /* ignore */
    }
    setReady(true)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      authMode: AUTH_MODE,
      login: (next) => {
        setUser(next)
        if (AUTH_MODE === 'mock') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        }
      },
      logout: () => {
        if (AUTH_MODE === 'supabase' && isSupabaseBrowserConfigured()) {
          void signOutSupabase()
        }
        setUser(null)
        localStorage.removeItem(STORAGE_KEY)
      },
    }),
    [user, ready],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
