'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type Props = {
  className?: string
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

export function GlobalSearch({ className }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [q, setQ] = useState('')

  useEffect(() => {
    if (pathname === '/search') {
      setQ(searchParams.get('q') ?? '')
    }
  }, [pathname, searchParams])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const term = q.trim()
    if (!term) return
    router.push(`/search?q=${encodeURIComponent(term)}`)
  }

  return (
    <form className={`global-search${className ? ` ${className}` : ''}`} onSubmit={submit} role="search">
      <SearchIcon />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari party, kontrak, isi dokumen…"
        aria-label="Cari party, kontrak, atau isi dokumen"
      />
    </form>
  )
}
