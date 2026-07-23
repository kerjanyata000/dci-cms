'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  className?: string
}

export function GlobalSearch({ className }: Props) {
  const router = useRouter()
  const [q, setQ] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const term = q.trim()
    if (!term) return
    router.push(`/search?q=${encodeURIComponent(term)}`)
  }

  return (
    <form className={`global-search${className ? ` ${className}` : ''}`} onSubmit={submit}>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari party, kontrak, isi dokumen…"
        aria-label="Smart search"
      />
      <Link href="/search" className="search-advanced-link">
        Advanced
      </Link>
    </form>
  )
}
