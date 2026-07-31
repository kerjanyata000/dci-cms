'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { DashboardRolePanels } from '@/components/dashboard/DashboardPanels'
import { fetchDashboard } from '@/lib/dashboard/api'
import {
  buildKpisForRole,
  buildPendingForRole,
  getDashboardCopy,
  type DashboardPayload,
} from '@/lib/dashboard/config'
import { ODOO_MODE } from '@/lib/odoo/client'
import { ROLES } from '@/lib/roles'
import type { AppRole } from '@/types/cms'

function OdooModeChip({ mode }: { mode: string }) {
  const chip = mode === 'live' ? 'live' : 'dummy'
  return (
    <span className={`odoo-mode-chip ${chip}`} title="Mode koneksi Odoo">
      Odoo {chip}
    </span>
  )
}

type Props = {
  role: AppRole
  userName: string
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

function ForbiddenBanner() {
  const searchParams = useSearchParams()
  const path = searchParams.get('forbidden')
  if (!path) return null
  return (
    <div className="notice notice-warn">
      <InfoIcon />
      <div>
        Akses ditolak ke <span className="mono">{path}</span>.
      </div>
    </div>
  )
}

function DashboardInner({ role, userName }: Props) {
  const [data, setData] = useState<DashboardPayload | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  const copy = getDashboardCopy(role)
  const canEdit = ROLES[role].canEdit

  useEffect(() => {
    setError('')
    fetchDashboard()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat dashboard'))
  }, [])

  function retryLoad() {
    setError('')
    setData(null)
    fetchDashboard()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat dashboard'))
  }

  const kpis = data ? buildKpisForRole(role, data) : []
  const pending = data ? buildPendingForRole(role, data) : []
  const kpiCount = role === 'legal' ? 5 : 4

  return (
    <div className="dashboard-page">
      <div className="page-head page-head-spread">
        <div>
          <div className="crumb">{copy.crumb}</div>
          <h1>
            {copy.titlePrefix} — {userName}
          </h1>
        </div>
        <div className="btn-row" style={{ alignItems: 'center' }}>
          {canEdit && role === 'legal' && (
            <button
              type="button"
              className="btn brass"
              onClick={() => router.push('/parties?upload=1')}
            >
              + Upload Contract
            </button>
          )}
          <OdooModeChip mode={data?.integration.odooMode ?? ODOO_MODE} />
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={retryLoad} />}

      <ForbiddenBanner />

      <div className={`kpi-grid kpi-cols-${kpiCount}`}>
        {data
          ? kpis.map((k) => <KpiCard key={k.label} {...k} />)
          : Array.from({ length: kpiCount }).map((_, i) => (
              <div key={i} className="kpi-card kpi-skeleton" aria-hidden />
            ))}
      </div>

      {data ? (
        <DashboardRolePanels role={role} data={data} pending={pending} />
      ) : (
        <div className="card dashboard-loading">
          <div className="dashboard-loading-bar" />
          <p className="muted">Memuat…</p>
        </div>
      )}
    </div>
  )
}

export function DashboardView(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="dashboard-page">
          <div className="page-head page-head-spread">
            <div>
              <div className="skeleton-line" style={{ width: 140, height: 12, marginBottom: 8 }} />
              <div className="skeleton-line" style={{ width: 320, height: 28, marginBottom: 8 }} />
            </div>
            <span className={`odoo-mode-chip ${ODOO_MODE}`}>Odoo {ODOO_MODE}</span>
          </div>
          <div className="kpi-grid kpi-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="kpi-card kpi-skeleton" aria-hidden />
            ))}
          </div>
        </div>
      }
    >
      <DashboardInner {...props} />
    </Suspense>
  )
}
