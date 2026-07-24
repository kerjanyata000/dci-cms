'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { LoginPage } from '@/components/LoginPage'

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/dashboard'
  return raw
}

function HomeInner() {
  const { user, ready, login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = safeNextPath(searchParams.get('next'))

  useEffect(() => {
    if (ready && user) router.replace(nextPath)
  }, [ready, user, router, nextPath])

  if (!ready) return null
  if (user) return null

  return (
    <LoginPage
      onLogin={(sessionUser) => {
        login(sessionUser)
        router.push(nextPath)
      }}
    />
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeInner />
    </Suspense>
  )
}
