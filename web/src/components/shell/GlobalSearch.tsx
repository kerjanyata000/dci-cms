'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type Props = {
  className?: string
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

  const advancedHref = q.trim()
    ? `/search?q=${encodeURIComponent(q.trim())}`
    : '/search'

  return (
    <form className={`global-search${className ? ` ${className}` : ''}`} onSubmit={submit}>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari party, kontrak, isi dokumen…"
        aria-label="Smart search"
      />
      <Link href={advancedHref} className="search-advanced-link">
        Advanced
      </Link>
    </form>
  )
}
