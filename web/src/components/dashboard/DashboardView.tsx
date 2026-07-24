'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { DashboardRolePanels } from '@/components/dashboard/DashboardPanels'
import { fetchDashboard } from '@/lib/dashboard/api'
import {
  buildKpisForRole,
  buildPendingForRole,
  getDashboardCopy,
  type DashboardPayload,
} from '@/lib/dashboard/config'
import type { AppRole } from '@/types/cms'

type Props = {
  role: AppRole
  userName: string
}

const showDevBanner = process.env.NODE_ENV !== 'production'

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

      {showDevBanner && data && (
        <div className="notice">
          <div>
            <b>FR-DASH-003</b> · {copy.notice}
            <div className="mono" style={{ marginTop: 6 }}>
              Odoo: {data.integration.odooMode.toUpperCase()} · RAGFlow:{' '}
              {data.integration.ragflowMode.toUpperCase()}
            </div>
          </div>
        </div>
      )}

      {!showDevBanner && (
        <div className="notice">
          <div>{copy.notice}</div>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}

      <div className={`kpi-grid kpi-cols-${role === 'legal' ? 5 : 4}`}>
        {data
          ? kpis.map((k) => <KpiCard key={k.label} {...k} />)
          : Array.from({ length: role === 'legal' ? 5 : 4 }).map((_, i) => (
              <div key={i} className="kpi-card kpi-skeleton" />
            ))}
      </div>

      {data ? (
        <DashboardRolePanels role={role} data={data} pending={pending} />
      ) : (
        <div className="card muted" style={{ marginTop: 16 }}>
          Memuat panel dashboard…
        </div>
      )}

      {data && (role === 'legal' || role === 'management') && (
        <p className="muted" style={{ marginTop: 16 }}>
          Renewal agenda lengkap: <Link href="/renewal">Renewal Calendar</Link> (FR-DASH-004) ·{' '}
          <Link href="/notifications">Notifikasi</Link>
        </p>
      )}
    </div>
  )
}
