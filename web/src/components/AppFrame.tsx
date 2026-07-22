'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { AppShell } from '@/components/AppShell'

export function AppFrame({ children }: { children: React.ReactNode }) {
  const { user, logout, ready } = useAuth()
  const router = useRouter()

  if (!ready) return null

  if (!user) {
    router.replace('/')
    return null
  }

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
