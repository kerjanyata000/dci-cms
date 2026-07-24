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

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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
        <b>Akses ditolak (RBAC).</b> Role Anda tidak memiliki akses ke{' '}
        <span className="mono">{path}</span> — BRL-CMS-001.
      </div>
    </div>
  )
}

function ViewOnlyBanner({ roleLabel, canSync }: { roleLabel: string; canSync: boolean }) {
  const extra = canSync
    ? ' Tombol SO Sync tetap tersedia di SO Health.'
    : ' Anda dapat melihat status & detail party (view-only).'
  return (
    <div className="readonly-banner dashboard-readonly">
      <LockIcon />
      <div>
        Login sebagai <b>{roleLabel}</b> — <b>view-only</b> pada create/edit kontrak &amp; party
        (BRL-CMS-001/002).{extra}
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
  const kpiCount = role === 'legal' ? 5 : 4

  return (
    <div className="dashboard-page">
      <div className="page-head">
        <div className="crumb">{copy.crumb}</div>
        <h1>
          {copy.titlePrefix} — {userName}
        </h1>
        <p className="page-desc">{copy.desc}</p>
      </div>

      {!roleCfg.canEdit && (
        <ViewOnlyBanner roleLabel={roleCfg.label} canSync={roleCfg.canSync} />
      )}

      <div className="workspace-banner">
        <span className={`role-workspace-chip ${role}`}>{roleCfg.label}</span>
        <p>{copy.notice}</p>
      </div>

      {error && <p className="error-text">{error}</p>}

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
          <p className="muted">Memuat panel dashboard…</p>
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
    <Suspense
      fallback={
        <div className="dashboard-page">
          <div className="kpi-grid kpi-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="kpi-card kpi-skeleton" />
            ))}
          </div>
        </div>
      }
    >
      <DashboardInner {...props} />
    </Suspense>
  )
}
