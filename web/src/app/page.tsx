'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { LoginPage } from '@/components/LoginPage'

export default function HomePage() {
  const { user, ready, login } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (ready && user) router.replace('/dashboard')
  }, [ready, user, router])

  if (!ready) return null
  if (user) return null

  return (
    <LoginPage
      onLogin={(next) => {
        login(next)
        router.push('/dashboard')
      }}
    />
  )
}
