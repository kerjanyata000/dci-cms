'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { DashboardRolePanels } from '@/components/dashboard/DashboardPanels'
import { fetchDashboard } from '@/lib/dashboard/api'
import {
  buildKpisForRole,
  buildPendingForRole,
  getDashboardCopy,
  type DashboardPayload,
} from '@/lib/dashboard/config'
import { ROLES } from '@/lib/roles'
import type { AppRole } from '@/types/cms'

type Props = {
  role: AppRole
  userName: string
}

const showDevBanner = process.env.NODE_ENV !== 'production'

function ForbiddenBanner() {
  const searchParams = useSearchParams()
  const path = searchParams.get('forbidden')
  if (!path) return null
  return (
    <div className="notice" style={{ borderColor: 'var(--amber)', marginBottom: 12 }}>
      <div>
        <b>Akses ditolak (RBAC).</b> Role Anda tidak memiliki akses ke{' '}
        <span className="mono">{path}</span> — BRL-CMS-001.
      </div>
    </div>
  )
}

function DashboardInner({ role, userName }: Props) {
  const [data, setData] = useState<DashboardPayload | null>(null)
  const [error, setError] = useState('')

  const copy = getDashboardCopy(role)
  const roleCfg = ROLES[role]

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat dashboard'))
  }, [])

  const kpis = data ? buildKpisForRole(role, data) : []
  const pending = data ? buildPendingForRole(role, data) : []

  return (
    <div>
      <div className="page-head spread-head">
        <div>
          <div className="crumb">{copy.crumb}</div>
          <h1>
            {copy.titlePrefix} — {userName}
          </h1>
          <p>{copy.desc}</p>
        </div>
        {data && (
          <div className="odoo-mode-chip" title="Mode integrasi">
            Odoo: {data.integration.odooMode.toUpperCase()} · RAGFlow:{' '}
            {data.integration.ragflowMode.toUpperCase()}
          </div>
        )}
      </div>

      <div className="notice">
        <div>
          <span className={`role-workspace-chip ${role}`}>{roleCfg.label}</span>
          <div style={{ marginTop: 6 }}>
            <b>{roleCfg.label}.</b> {copy.notice}
          </div>
          {showDevBanner && data && (
            <div className="mono" style={{ marginTop: 8, fontSize: 11 }}>
              FR-DASH-003 · dev banner
            </div>
          )}
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <ForbiddenBanner />

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
        <div className="card muted" style={{ marginTop: 0 }}>
          Memuat panel dashboard…
        </div>
      )}

      {data && (
        <p className="footer-note">
          Dashboard monitoring (tanpa CTA create) · Odoo adapter {data.integration.odooMode.toUpperCase()}{' '}
          · BRD FR-DASH-003
          {(role === 'legal' || role === 'management') && (
            <>
              {' '}
              · <Link href="/renewal">Renewal Calendar</Link> ·{' '}
              <Link href="/notifications">Notifikasi</Link>
            </>
          )}
        </p>
      )}
    </div>
  )
}

export function DashboardView(props: Props) {
  return (
    <Suspense fallback={<div className="muted">Memuat dashboard…</div>}>
      <DashboardInner {...props} />
    </Suspense>
  )
}
