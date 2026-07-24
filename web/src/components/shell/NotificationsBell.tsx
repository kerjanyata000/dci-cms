'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BellIcon } from '@/components/ui/icons'
import { cmsFetch } from '@/lib/api/http'
import { useNotificationReadState } from '@/lib/notifications/useNotificationReadState'

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
  const { markRead, isRead } = useNotificationReadState()

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

  const unreadUrgentCount = useMemo(
    () => items.filter((i) => i.urgent && !isRead(i.id)).length,
    [items, isRead],
  )

  function handleOpenItem(n: NotificationItem) {
    markRead(n.id)
    setOpen(false)
  }

  return (
    <div className="notif-wrap" ref={ref}>
      <button
        type="button"
        className="btn ghost notif-btn"
        aria-label="Notifikasi"
        onClick={() => setOpen((v) => !v)}
      >
        <BellIcon />
        {unreadUrgentCount > 0 && <span className="notif-badge">{unreadUrgentCount}</span>}
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
                <li
                  key={n.id}
                  className={`${n.urgent ? 'urgent' : ''}${isRead(n.id) ? ' notif-read' : ''}`}
                >
                  {n.href ? (
                    <Link href={n.href} onClick={() => handleOpenItem(n)}>
                      <b>{n.title}</b>
                      <span>{n.sub}</span>
                      <span className="mono notif-code">{n.code}</span>
                    </Link>
                  ) : (
                    <button type="button" className="notif-item-btn" onClick={() => markRead(n.id)}>
                      <b>{n.title}</b>
                      <span>{n.sub}</span>
                    </button>
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
