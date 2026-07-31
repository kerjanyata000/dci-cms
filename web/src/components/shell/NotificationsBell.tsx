'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BellIcon } from '@/components/ui/icons'
import { cmsFetch } from '@/lib/api/http'
import { useNotificationReadState } from '@/lib/notifications/useNotificationReadState'
import {
  resolveNotificationLevel,
  type NotificationItem,
  type NotificationLevel,
} from '@/lib/notifications/types'

function formatRelativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(ms) || ms < 0) return 'Baru saja'
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'Baru saja'
  if (mins < 60) return `${mins} menit lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} hari lalu`
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

function levelLabel(level: NotificationLevel): string {
  if (level === 'danger') return 'Danger'
  if (level === 'warning') return 'Warning'
  return 'Normal'
}

function NotifRow({
  n,
  read,
  onOpen,
}: {
  n: NotificationItem
  read: boolean
  onOpen: () => void
}) {
  const level = n.level ?? resolveNotificationLevel({ urgent: n.urgent, code: n.code })
  const body = (
    <>
      <div className="notif-item-main">
        <p className="notif-desc">
          <strong>{n.title}</strong>
          {n.sub ? ` ${n.sub}` : ''}
        </p>
        <span className="notif-meta">
          {formatRelativeTime(n.created_at)} · {n.code}
        </span>
      </div>
      <span
        className={`notif-dot notif-dot-${level}`}
        title={levelLabel(level)}
        aria-label={levelLabel(level)}
      />
    </>
  )

  return (
    <li className={`notif-row${read ? ' notif-read' : ''}`}>
      {n.href ? (
        <Link href={n.href} className="notif-item" onClick={onOpen}>
          {body}
        </Link>
      ) : (
        <button type="button" className="notif-item notif-item-btn" onClick={onOpen}>
          {body}
        </button>
      )}
    </li>
  )
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const ref = useRef<HTMLDivElement>(null)
  const { markRead, markAllRead, isRead } = useNotificationReadState()

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

  const preview = useMemo(() => items.slice(0, 6), [items])
  const unreadCount = useMemo(
    () => items.filter((i) => !isRead(i.id)).length,
    [items, isRead],
  )
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
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <BellIcon />
        {unreadUrgentCount > 0 && <span className="notif-badge">{unreadUrgentCount}</span>}
      </button>
      {open && (
        <div className="notif-panel" role="dialog" aria-label="Notifikasi">
          <div className="notif-panel-head">
            <b>Notifikasi</b>
            <button
              type="button"
              className="notif-text-btn"
              disabled={unreadCount === 0}
              onClick={() => markAllRead(items.map((i) => i.id))}
            >
              Tandai semua dibaca
            </button>
          </div>
          {preview.length === 0 ? (
            <p className="notif-empty">Tidak ada notifikasi.</p>
          ) : (
            <ul className="notif-list">
              {preview.map((n) => (
                <NotifRow
                  key={n.id}
                  n={n}
                  read={isRead(n.id)}
                  onOpen={() => handleOpenItem(n)}
                />
              ))}
            </ul>
          )}
          <div className="notif-panel-foot">
            <Link href="/notifications" className="notif-text-btn" onClick={() => setOpen(false)}>
              Lihat semua notifikasi
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
