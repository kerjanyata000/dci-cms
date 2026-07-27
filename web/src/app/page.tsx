'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { LoginRedirectOverlay } from '@/components/LoginRedirectOverlay'
import { LoginPage, LoginPageSkeleton } from '@/components/LoginPage'

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/dashboard'
  return raw
}

function HomeInner() {
  const { user, ready, login, logout, authMode } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = safeNextPath(searchParams.get('next'))
  const [entering, setEntering] = useState(false)
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    if (!ready || !user || entering) return
    router.replace(nextPath)
  }, [ready, user, router, nextPath, entering])

  if (!ready) return <LoginPageSkeleton />
  if (user) {
    return (
      <LoginRedirectOverlay
        onStuck={() => {
          logout()
          setEntering(false)
          router.replace('/')
        }}
      />
    )
  }

  return (
    <LoginPage
      authMode={authMode}
      errorHint={loginError}
      onLogin={async (sessionUser) => {
        setLoginError('')
        setEntering(true)
        try {
          await login(sessionUser)
          router.replace(nextPath)
        } catch (err) {
          setEntering(false)
          setLoginError(err instanceof Error ? err.message : 'Gagal menyimpan sesi')
        }
      }}
    />
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<LoginPageSkeleton />}>
      <HomeInner />
    </Suspense>
  )
}
