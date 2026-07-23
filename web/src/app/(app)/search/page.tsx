'use client'

import { SmartSearchView } from '@/components/search/SmartSearchView'
import { useAuth } from '@/components/AuthProvider'
import { ROLES } from '@/lib/roles'

export default function SearchPage() {
  const { user } = useAuth()
  const canEdit = user ? ROLES[user.role].canEdit : false

  return <SmartSearchView canEdit={canEdit} />
}
