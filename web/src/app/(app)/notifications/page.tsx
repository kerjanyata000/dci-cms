'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
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

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'urgent'>('all')

  useEffect(() => {
    cmsFetch('/api/notifications')
      .then((r) => r.json())
      .then((p) => {
        if (p.ok) setItems(p.data.notifications ?? [])
        else setError(p.error ?? 'Gagal memuat')
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat'))
  }, [])

  const visible = filter === 'urgent' ? items.filter((i) => i.urgent) : items

  return (
    <div>
      <div className="page-head row-actions spread">
        <div>
          <h1>Notifikasi</h1>
          <p>NOTIF-CMS-* · event Odoo link, SO sync, renewal, audit (mockup parity).</p>
        </div>
        <Link href="/activity" className="btn ghost">
          Activity Log
        </Link>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="card stack">
        <div className="row-actions">
          <button
            type="button"
            className={`btn ghost ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Semua ({items.length})
          </button>
          <button
            type="button"
            className={`btn ghost ${filter === 'urgent' ? 'active' : ''}`}
            onClick={() => setFilter('urgent')}
          >
            Urgent ({items.filter((i) => i.urgent).length})
          </button>
        </div>

        {visible.length === 0 ? (
          <p className="muted">Tidak ada notifikasi{filter === 'urgent' ? ' urgent' : ''}.</p>
        ) : (
          <ul className="notif-list notif-list-page">
            {visible.map((n) => (
              <li key={n.id} className={n.urgent ? 'urgent' : ''}>
                {n.href ? (
                  <Link href={n.href}>
                    <div className="notif-row-head">
                      <b>{n.title}</b>
                      <span className="mono notif-code">{n.code}</span>
                    </div>
                    <span>{n.sub}</span>
                    <span className="muted mono">
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
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
