'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { fetchDashboard } from '@/lib/dashboard/api'
import {
  buildKpisForRole,
  buildPendingForRole,
  getDashboardCopy,
  type DashboardPayload,
} from '@/lib/dashboard/config'
import { ODOO_MODE } from '@/lib/odoo/client'
import { RAGFLOW_MODE } from '@/lib/ragflow/client'
import type { AppRole } from '@/types/cms'

type Props = {
  role: AppRole
  userName: string
}

export function DashboardView({ role, userName }: Props) {
  const [data, setData] = useState<DashboardPayload | null>(null)
  const [error, setError] = useState('')

  const copy = getDashboardCopy(role)

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat dashboard'))
  }, [])

  const kpis = data ? buildKpisForRole(role, data) : []
  const pending = data ? buildPendingForRole(role, data) : []

  return (
    <div>
      <div className="page-head">
        <div className="crumb">{copy.crumb}</div>
        <h1>
          {copy.title} — {userName}
        </h1>
        <p>{copy.desc}</p>
      </div>

      <div className="notice">
        <div>
          <b>FR-DASH-003</b> · {copy.notice}
          <div className="mono" style={{ marginTop: 6 }}>
            Odoo: {ODOO_MODE.toUpperCase()} · RAGFlow: {RAGFLOW_MODE.toUpperCase()}
          </div>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className={`kpi-grid kpi-cols-${role === 'legal' ? 5 : 4}`}>
        {data
          ? kpis.map((k) => <KpiCard key={k.label} {...k} />)
          : Array.from({ length: role === 'legal' ? 5 : 4 }).map((_, i) => (
              <div key={i} className="kpi-card kpi-skeleton" />
            ))}
      </div>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="card stack">
          <div className="card-head">
            <h3>Pending Actions</h3>
            <span className="ref-tag">FR-DASH-005</span>
          </div>
          {pending.length === 0 ? (
            <p className="muted">Tidak ada pending action dari data saat ini.</p>
          ) : (
            <ul className="pending-list">
              {pending.map((item, i) => (
                <li key={i} className="pending-item">
                  <div>
                    <b>{item.title}</b>
                    <br />
                    <span className="muted">{item.sub}</span>
                  </div>
                  {item.href ? (
                    <Link href={item.href} className="btn ghost">
                      Buka
                    </Link>
                  ) : item.pill ? (
                    <span className={`pill pill-${item.pillClass ?? 'pending'}`}>{item.pill}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card stack">
          <div className="card-head">
            <h3>Register snapshot</h3>
            <span className="ref-tag">BRL-CMS-026</span>
          </div>
          {data ? (
            <ul className="list">
              <li>Parties: {data.stats.totalParties}</li>
              <li>Contracts: {data.stats.totalContracts}</li>
              <li>Odoo linked: {data.stats.linkedParties}</li>
              <li>Pending link: {data.stats.pendingOdooLink}</li>
              <li>Mismatch/relink: {data.stats.mismatchOdooLink}</li>
            </ul>
          ) : (
            <p className="muted">Memuat…</p>
          )}
          <p className="muted" style={{ marginTop: 8 }}>
            Renewal agenda lengkap: <Link href="/renewal">Renewal Calendar</Link> (FR-DASH-004).
          </p>
        </div>
      </div>
    </div>
  )
}
