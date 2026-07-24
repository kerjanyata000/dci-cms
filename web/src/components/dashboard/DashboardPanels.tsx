'use client'

import Link from 'next/link'
import type {
  DashboardPayload,
  LifecycleBreakdown,
  PendingItem,
  PicWorkloadRow,
  RenewalTimelineRow,
} from '@/lib/dashboard/config'
import type { AppRole } from '@/types/cms'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function lifecycleGradient(l: LifecycleBreakdown): string {
  if (l.total === 0) return 'conic-gradient(var(--slate-light) 0 100%)'
  const a = (l.active / l.total) * 100
  const r = a + (l.review / l.total) * 100
  return `conic-gradient(var(--green) 0 ${a}%, var(--amber) ${a}% ${r}%, var(--slate-light) ${r}% 100%)`
}

export function LifecycleDonut({ lifecycle }: { lifecycle: LifecycleBreakdown }) {
  return (
    <div className="donut-wrap">
      <div className="donut" style={{ background: lifecycleGradient(lifecycle) }}>
        <div className="donut-center">
          <b>{lifecycle.total}</b>
          <span>Kontrak</span>
        </div>
      </div>
      <div className="legend">
        <div className="legend-row">
          <span className="legend-dot" style={{ background: 'var(--green)' }} />
          Active / Fully Signed
          <b>{lifecycle.active}</b>
        </div>
        <div className="legend-row">
          <span className="legend-dot" style={{ background: 'var(--amber)' }} />
          Under Review
          <b>{lifecycle.review}</b>
        </div>
        <div className="legend-row">
          <span
            className="legend-dot"
            style={{ background: 'var(--slate-light)', border: '1px solid var(--line)' }}
          />
          Draft
          <b>{lifecycle.draft}</b>
        </div>
      </div>
    </div>
  )
}

export function PicWorkloadList({ rows }: { rows: PicWorkloadRow[] }) {
  if (rows.length === 0) {
    return <p className="muted">Belum ada data PIC pada register party.</p>
  }
  const max = rows[0]?.count ?? 1
  return (
    <div>
      {rows.map((row, i) => (
        <div key={row.pic} className="pic-row">
          <span className="pic-rank">{i + 1}</span>
          <div className="pic-avatar">{initials(row.pic)}</div>
          <span className="pic-name">{row.pic}</span>
          <div className="pic-bar-wrap">
            <div className="pic-bar" style={{ width: `${Math.round((row.count / max) * 100)}%` }} />
          </div>
          <span className="pic-count">{row.count}</span>
        </div>
      ))}
    </div>
  )
}

function formatTimelineDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`)
  return {
    day: d.toLocaleDateString('id-ID', { day: '2-digit' }),
    month: d.toLocaleDateString('id-ID', { month: 'short' }),
  }
}

export function RenewalTimeline({ rows }: { rows: RenewalTimelineRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="muted">
        Tidak ada renewal upcoming. Jalankan <code>npm run seed:demo:dates</code> untuk demo.
      </p>
    )
  }
  return (
    <div className="timeline">
      {rows.map((row) => {
        const dt = formatTimelineDate(row.renewal_date)
        const pillLabel =
          row.bucket === 'urgent' ? `${row.days_left} hari` : row.bucket === 'soon' ? 'Segera' : 'Q+'
        return (
          <div key={`${row.party_code}-${row.renewal_date}`} className="tl-item">
            <div className={`tl-date ${row.bucket === 'urgent' ? 'urgent' : ''}`}>
              <b>{dt.day}</b>
              <span>{dt.month}</span>
            </div>
            <div className="tl-body">
              <b>{row.party_code}</b>
              <span>
                {row.contract_code} · est. {row.renewal_date}
              </span>
            </div>
            <span className={`tl-pill ${row.bucket}`}>{pillLabel}</span>
          </div>
        )
      })}
    </div>
  )
}

export function PendingList({ items }: { items: PendingItem[] }) {
  if (items.length === 0) {
    return <p className="muted">Tidak ada pending action dari data saat ini.</p>
  }
  return (
    <ul className="pending-list">
      {items.map((item, i) => (
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
  )
}

export function IntegrationCard({
  odooMode,
  ragflowMode,
}: {
  odooMode: string
  ragflowMode: string
}) {
  return (
    <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
      Partner/SO dari adapter <b>{odooMode.toUpperCase()}</b> · RAGFlow{' '}
      <b>{ragflowMode.toUpperCase()}</b>. Run Sync di menu <Link href="/so">SO Health</Link> (BRD
      §6.10).
    </p>
  )
}

export function DashboardRolePanels({
  role,
  data,
  pending,
}: {
  role: AppRole
  data: DashboardPayload
  pending: PendingItem[]
}) {
  if (role === 'legal') {
    return (
      <>
        <div className="grid-2">
          <div className="card stack">
            <div className="card-head">
              <h3>Antrian Legal (Pending Actions)</h3>
              <span className="ref-tag">FR-DASH-005</span>
            </div>
            <PendingList items={pending} />
          </div>
          <div className="card stack">
            <div className="card-head">
              <h3>Contract Lifecycle</h3>
            </div>
            <LifecycleDonut lifecycle={data.lifecycle} />
          </div>
        </div>
        <div className="grid-2" style={{ marginTop: 16 }}>
          <div className="card stack">
            <div className="card-head">
              <h3>PIC Workload</h3>
            </div>
            <PicWorkloadList rows={data.picWorkload} />
          </div>
          <div className="card stack">
            <div className="card-head">
              <h3>Odoo adapter</h3>
            </div>
            <IntegrationCard
              odooMode={data.integration.odooMode}
              ragflowMode={data.integration.ragflowMode}
            />
          </div>
        </div>
      </>
    )
  }

  if (role === 'management') {
    return (
      <div className="grid-2">
        <div className="card stack">
          <div className="card-head">
            <h3>Renewal risk</h3>
            <Link href="/renewal" className="ref-tag">
              Kalender →
            </Link>
          </div>
          <RenewalTimeline rows={data.renewalTimeline} />
        </div>
        <div className="card stack">
          <div className="card-head">
            <h3>Portfolio composition</h3>
          </div>
          <LifecycleDonut lifecycle={data.lifecycle} />
          <p className="muted" style={{ marginTop: 14, marginBottom: 0 }}>
            View-only — oversight via <Link href="/activity">Activity Log</Link>.
          </p>
        </div>
      </div>
    )
  }

  if (role === 'finance') {
    return (
      <div className="grid-2">
        <div className="card stack">
          <div className="card-head">
            <h3>SO snapshot</h3>
            <span className="ref-tag">INT-SO</span>
          </div>
          <ul className="list">
            <li>Synchronized: {data.soHealth.synchronized}</li>
            <li>No Active SO: {data.soHealth.noActiveSo}</li>
            <li>In Progress: {data.soHealth.inProgress}</li>
            <li>Sync errors (7d): {data.soHealth.syncErrors}</li>
          </ul>
        </div>
        <div className="card stack">
          <div className="card-head">
            <h3>SO yang perlu perhatian</h3>
            <Link href="/so" className="ref-tag">
              SO Monitor →
            </Link>
          </div>
          <PendingList items={pending} />
        </div>
      </div>
    )
  }

  if (role === 'it') {
    return (
      <div className="grid-2">
        <div className="card stack">
          <div className="card-head">
            <h3>Integration exceptions</h3>
          </div>
          <PendingList items={pending} />
        </div>
        <div className="card stack">
          <div className="card-head">
            <h3>Integrasi</h3>
          </div>
          <IntegrationCard
            odooMode={data.integration.odooMode}
            ragflowMode={data.integration.ragflowMode}
          />
        </div>
      </div>
    )
  }

  // business
  return (
    <div className="grid-2">
      <div className="card stack">
        <div className="card-head">
          <h3>Status kontrak (view-only)</h3>
        </div>
        <PendingList
          items={data.recentContracts.slice(0, 4).map((c) => ({
            title: c.contract_code,
            sub: `${c.party_code ?? 'Party'} · ${c.status_text}`,
            href: `/parties/${c.party_id}`,
            pill: c.status_text,
            pillClass: c.status,
          }))}
        />
      </div>
      <div className="card stack">
        <div className="card-head">
          <h3>Akses Requestor</h3>
        </div>
        <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
          View-only pada lifecycle. Detail Party lewat menu <Link href="/parties">Parties</Link>.
          Tidak ada CTA create di dashboard.
        </p>
      </div>
    </div>
  )
}
