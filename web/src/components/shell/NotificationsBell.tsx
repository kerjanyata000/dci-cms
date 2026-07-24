'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { BellIcon } from '@/components/ui/icons'
import { cmsFetch } from '@/lib/api/http'

type NotificationItem = {
  id: string
  code: string
  title: string
  sub: string
  urgent: boolean
  href?: string
  created_at: string
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    cmsFetch('/api/notifications')
      .then((r) => r.json())
      .then((p) => {
        if (p.ok) setItems(p.data.notifications ?? [])
      })
      .catch(() => setItems([]))
  }, [])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const urgentCount = items.filter((i) => i.urgent).length

  return (
    <div className="notif-wrap" ref={ref}>
      <button
        type="button"
        className="btn ghost notif-btn"
        aria-label="Notifikasi"
        onClick={() => setOpen((v) => !v)}
      >
        <BellIcon />
        {urgentCount > 0 && <span className="notif-badge">{urgentCount}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          <div className="notif-panel-head">
            <b>Notifikasi</b>
            <Link href="/notifications" className="muted" onClick={() => setOpen(false)}>
              Lihat semua
            </Link>
          </div>
          {items.length === 0 ? (
            <p className="muted" style={{ padding: 12 }}>
              Tidak ada notifikasi.
            </p>
          ) : (
            <ul className="notif-list">
              {items.map((n) => (
                <li key={n.id} className={n.urgent ? 'urgent' : ''}>
                  {n.href ? (
                    <Link href={n.href} onClick={() => setOpen(false)}>
                      <b>{n.title}</b>
                      <span>{n.sub}</span>
                      <span className="mono notif-code">{n.code}</span>
                    </Link>
                  ) : (
                    <div>
                      <b>{n.title}</b>
                      <span>{n.sub}</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
