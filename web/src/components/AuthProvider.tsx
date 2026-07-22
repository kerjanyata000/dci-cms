'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { SessionUser } from '@/lib/roles'

type AuthContextValue = {
  user: SessionUser | null
  login: (user: SessionUser) => void
  logout: () => void
  ready: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)
const STORAGE_KEY = 'cms.session'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
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
      login: (next) => {
        setUser(next)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      },
      logout: () => {
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
