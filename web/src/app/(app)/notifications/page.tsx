'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { cmsFetch } from '@/lib/api/http'
import { useNotificationReadState } from '@/lib/notifications/useNotificationReadState'
import { TablePagination, paginateSlice } from '@/components/ui/TablePagination'

type NotificationItem = {
  id: string
  code: string
  title: string
  sub: string
  urgent: boolean
  href?: string
  created_at: string
}

const NOTIF_PAGE_SIZE = 10

function sortNotifications(items: NotificationItem[], mode: 'date' | 'urgent'): NotificationItem[] {
  return [...items].sort((a, b) => {
    if (mode === 'urgent' && a.urgent !== b.urgent) {
      return Number(b.urgent) - Number(a.urgent)
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'urgent'>('all')
  const [sortMode, setSortMode] = useState<'date' | 'urgent'>('date')
  const [page, setPage] = useState(1)
  const { markRead, markAllRead, isRead } = useNotificationReadState()

  useEffect(() => {
    setLoading(true)
    cmsFetch('/api/notifications')
      .then((r) => r.json())
      .then((p) => {
        if (p.ok) setItems(p.data.notifications ?? [])
        else setError(p.error ?? 'Gagal memuat')
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(
    () => (filter === 'urgent' ? items.filter((i) => i.urgent) : items),
    [items, filter],
  )

  const visible = useMemo(() => sortNotifications(filtered, sortMode), [filtered, sortMode])

  useEffect(() => {
    setPage(1)
  }, [filter, sortMode])

  const pageItems = useMemo(() => paginateSlice(visible, page, NOTIF_PAGE_SIZE), [visible, page])
  const unreadCount = items.filter((i) => !isRead(i.id)).length

  return (
    <div>
      <div className="page-head row-actions spread">
        <div>
          <div className="crumb">Registry</div>
          <h1>Notifikasi</h1>
          <p>NOTIF-CMS-* · event Odoo link, SO sync, renewal, audit.</p>
        </div>
        <div className="row-actions">
          {unreadCount > 0 && (
            <button
              type="button"
              className="btn ghost"
              onClick={() => markAllRead(items.map((i) => i.id))}
            >
              Tandai semua dibaca
            </button>
          )}
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="table-toolbar">
        <button
          type="button"
          className={`filter-chip clickable${filter === 'all' ? ' active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Semua ({items.length})
        </button>
        <button
          type="button"
          className={`filter-chip clickable${filter === 'urgent' ? ' active' : ''}`}
          onClick={() => setFilter('urgent')}
        >
          Urgent ({items.filter((i) => i.urgent).length})
        </button>
        <button
          type="button"
          className={`filter-chip clickable${sortMode === 'date' ? ' active' : ''}`}
          onClick={() => setSortMode('date')}
        >
          Terbaru
        </button>
        <button
          type="button"
          className={`filter-chip clickable${sortMode === 'urgent' ? ' active' : ''}`}
          onClick={() => setSortMode('urgent')}
        >
          Urgent dulu
        </button>
      </div>

      <div className="card stack" style={{ marginTop: 0 }}>
        {loading && <p className="muted">Memuat notifikasi…</p>}
        {!loading && pageItems.length === 0 && (
          <p className="muted">Tidak ada notifikasi{filter === 'urgent' ? ' urgent' : ''}.</p>
        )}
        {!loading && pageItems.length > 0 && (
          <ul className="notif-list notif-list-page">
            {pageItems.map((n) => (
              <li
                key={n.id}
                className={`${n.urgent ? 'urgent' : ''}${isRead(n.id) ? ' notif-read' : ''}`}
              >
                {n.href ? (
                  <Link href={n.href} onClick={() => markRead(n.id)}>
                    <div className="notif-row-head">
                      <b>{n.title}</b>
                      <span className="mono notif-code">{n.code}</span>
                    </div>
                    <span>{n.sub}</span>
                    <span className="muted mono notif-time">
                      {new Date(n.created_at).toLocaleString('id-ID')}
                    </span>
                  </Link>
                ) : (
                  <div>
                    <div className="notif-row-head">
                      <b>{n.title}</b>
                      <span className="mono notif-code">{n.code}</span>
                    </div>
                    <span>{n.sub}</span>
                    <span className="muted mono notif-time">
                      {new Date(n.created_at).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        <TablePagination
          page={page}
          pageSize={NOTIF_PAGE_SIZE}
          total={visible.length}
          onPageChange={setPage}
          itemLabel="Notifikasi"
        />
      </div>
    </div>
  )
}
