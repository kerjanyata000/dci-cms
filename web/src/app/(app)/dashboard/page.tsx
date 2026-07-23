'use client'

import { useAuth } from '@/components/AuthProvider'
import { DashboardView } from '@/components/dashboard/DashboardView'

export default function DashboardPage() {
  const { user } = useAuth()
  if (!user) return null

  return <DashboardView role={user.role} userName={user.name} />
}
