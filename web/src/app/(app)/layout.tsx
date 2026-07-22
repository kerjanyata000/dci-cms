'use client'

import { AppFrame } from '@/components/AppFrame'

export default function AppSectionLayout({ children }: { children: React.ReactNode }) {
  return <AppFrame>{children}</AppFrame>
}
