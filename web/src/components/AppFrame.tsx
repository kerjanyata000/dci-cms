'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { AppShell } from '@/components/AppShell'

export function AppFrame({ children }: { children: React.ReactNode }) {
  const { user, logout, ready } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (ready && !user) router.replace('/')
  }, [ready, user, router])

  if (!ready || !user) return null

  return (
    <AppShell
      user={user}
      onLogout={() => {
        logout()
        router.replace('/')
      }}
    >
      {children}
    </AppShell>
  )
}
