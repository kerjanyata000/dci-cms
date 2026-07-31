'use client'

import Link from 'next/link'
import { useCallback, useMemo, useState } from 'react'
import type {
  DashboardPayload,
  LifecycleBreakdown,
  PendingItem,
  PicWorkloadRow,
  RenewalTimelineRow,
  CommercialBar,
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

type DonutSegment = {
  key: string
  label: string
  value: number
  color: string
  labelColor: string
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function donutSlicePath(
  cx: number,
  cy: number,
  rOut: number,
  rIn: number,
  startAngle: number,
  endAngle: number,
) {
  const sweep = endAngle - startAngle
  if (sweep <= 0) return ''
  if (sweep >= 359.999) {
    return [
      `M ${cx} ${cy - rOut}`,
      `A ${rOut} ${rOut} 0 1 1 ${cx - 0.001} ${cy - rOut}`,
      `L ${cx - 0.001} ${cy - rIn}`,
      `A ${rIn} ${rIn} 0 1 0 ${cx} ${cy - rIn}`,
      'Z',
    ].join(' ')
  }
  const p1 = polar(cx, cy, rOut, startAngle)
  const p2 = polar(cx, cy, rOut, endAngle)
  const p3 = polar(cx, cy, rIn, endAngle)
  const p4 = polar(cx, cy, rIn, startAngle)
  const large = sweep > 180 ? 1 : 0
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${rOut} ${rOut} 0 ${large} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${rIn} ${rIn} 0 ${large} 0 ${p4.x} ${p4.y}`,
    'Z',
  ].join(' ')
}

function buildLifecycleSegments(lifecycle: LifecycleBreakdown): DonutSegment[] {
  const remainder = Math.max(0, lifecycle.total - lifecycle.active - lifecycle.review)
  return [
    {
      key: 'active',
      label: 'Active / Fully Signed',
      value: lifecycle.active,
      color: 'var(--green)',
      labelColor: 'var(--green)',
    },
    {
      key: 'review',
      label: 'Under Review',
      value: lifecycle.review,
      color: 'var(--amber)',
      labelColor: 'var(--amber)',
    },
    {
      key: 'draft',
      label: 'Draft',
      value: remainder,
      color: 'var(--slate-light)',
      labelColor: 'var(--muted)',
    },
  ].filter((s) => s.value > 0)
}

type TipState = {
  label: string
  value: number
  labelColor: string
  x: number
  y: number
} | null

export function LifecycleDonut({ lifecycle }: { lifecycle: LifecycleBreakdown }) {
  const [tip, setTip] = useState<TipState>(null)
  const segments = useMemo(() => buildLifecycleSegments(lifecycle), [lifecycle])
  const total = lifecycle.total

  const arcs = useMemo(() => {
    if (total <= 0) return []
    let angle = 0
    return segments.map((seg) => {
      const sweep = (seg.value / total) * 360
      const start = angle
      const end = angle + sweep
      angle = end
      return {
        ...seg,
        d: donutSlicePath(75, 75, 72, 49, start, end),
      }
    })
  }, [segments, total])

  const onMove = useCallback(
    (e: React.MouseEvent<SVGPathElement>, seg: DonutSegment) => {
      const wrap = e.currentTarget.closest('.donut-chart') as HTMLElement | null
      if (!wrap) return
      const rect = wrap.getBoundingClientRect()
      setTip({
        label: seg.label,
        value: seg.value,
        labelColor: seg.labelColor,
        x: e.clientX - rect.left + 12,
        y: e.clientY - rect.top - 10,
      })
    },
    [],
  )

  return (
    <div className="donut-wrap">
      <div className="donut-chart">
        <svg className="donut-svg" viewBox="0 0 150 150" role="img" aria-label="Contract lifecycle">
          {total === 0 ? (
            <circle cx="75" cy="75" r="60.5" fill="var(--slate-light)" />
          ) : (
            arcs.map((arc) => (
              <path
                key={arc.key}
                d={arc.d}
                fill={arc.color}
                className="donut-seg"
                stroke="var(--paper-2)"
                strokeWidth={1}
                onMouseMove={(e) => onMove(e, arc)}
                onMouseLeave={() => setTip(null)}
              />
            ))
          )}
        </svg>
        <div className="donut-center">
          <b>{lifecycle.total}</b>
          <span>Kontrak</span>
        </div>
        {tip && (
          <div
            className="donut-tip"
            style={{
              left: Math.min(tip.x, 118),
              top: Math.max(tip.y, 28),
            }}
            role="tooltip"
          >
            <span className="donut-tip-label" style={{ color: tip.labelColor }}>
              {tip.label}
            </span>
            <span className="donut-tip-value">{tip.value}</span>
          </div>
        )}
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
            <Link href={item.href} className="btn ghost small">
              Buka
            </Link>
          ) : item.pill ? (
            <span className={`status-pill ${item.pillClass ?? 'pending'}`}>{item.pill}</span>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

export function CommercialBars({ bars }: { bars: CommercialBar[] }) {
  if (bars.length === 0) {
    return <p className="muted">Belum ada metadata komersial pada kontrak.</p>
  }
  return (
    <div>
      {bars.map((bar) => {
        const pct = bar.total > 0 ? Math.round((bar.filled / bar.total) * 1000) / 10 : 0
        return (
          <div key={bar.label} className="bar-row">
            <div className="bar-top">
              <span>{bar.label}</span>
              <span>
                {bar.filled} / {bar.total}
              </span>
            </div>
            <div className="bar-track">
              <div
                className={`bar-fill ${bar.tone}`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
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
      Partner/SO dari Odoo (<b>{odooMode.toUpperCase()}</b>) · ekstraksi dokumen{' '}
      <b>{ragflowMode.toUpperCase()}</b>. Run Sync di menu <Link href="/so">SO Health</Link>.
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
      <div className="dashboard-panels">
        <div className="card stack">
          <div className="card-head">
            <h3>Antrian Legal (Pending Actions)</h3>
          </div>
          <div className="dashboard-panel-body dashboard-panel-scroll">
            <PendingList items={pending} />
          </div>
        </div>
        <div className="card stack">
          <div className="card-head">
            <h3>Contract Lifecycle</h3>
          </div>
          <div className="dashboard-panel-body dashboard-panel-center">
            <LifecycleDonut lifecycle={data.lifecycle} />
          </div>
        </div>
        <div className="card stack">
          <div className="card-head">
            <h3>PIC Workload</h3>
          </div>
          <div className="dashboard-panel-body dashboard-panel-scroll">
            <PicWorkloadList rows={data.picWorkload} />
          </div>
        </div>
        <div className="card stack">
          <div className="card-head">
            <h3>Renewal upcoming</h3>
            <Link href="/renewal" className="link-tag">
              Kalender →
            </Link>
          </div>
          <div className="dashboard-panel-body dashboard-panel-scroll">
            <RenewalTimeline rows={data.renewalTimeline} />
          </div>
        </div>
      </div>
    )
  }

  if (role === 'management') {
    return (
      <div className="grid-2" style={{ marginTop: 0 }}>
        <div className="card stack" style={{ marginTop: 0 }}>
          <div className="card-head">
            <h3>Renewal risk</h3>
            <Link href="/renewal" className="link-tag">
              Kalender →
            </Link>
          </div>
          <div className="dashboard-panel-body dashboard-panel-scroll">
            <RenewalTimeline rows={data.renewalTimeline} />
          </div>
        </div>
        <div className="card stack" style={{ marginTop: 0 }}>
          <div className="card-head">
            <h3>Portfolio composition</h3>
          </div>
          <div className="dashboard-panel-body dashboard-panel-center">
            <LifecycleDonut lifecycle={data.lifecycle} />
            <p className="muted" style={{ marginTop: 14, marginBottom: 0 }}>
              View-only — oversight via <Link href="/activity">Activity Log</Link>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (role === 'finance') {
    return (
      <div className="grid-2" style={{ marginTop: 0 }}>
        <div className="card stack" style={{ marginTop: 0 }}>
          <div className="card-head">
            <h3>Commercial snapshot</h3>
          </div>
          <div className="dashboard-panel-body dashboard-panel-center">
            <CommercialBars bars={data.commercialBars} />
          </div>
        </div>
        <div className="card stack" style={{ marginTop: 0 }}>
          <div className="card-head">
            <h3>SO yang perlu perhatian</h3>
            <Link href="/so" className="link-tag">
              SO Monitor →
            </Link>
          </div>
          <div className="dashboard-panel-body dashboard-panel-scroll">
            <PendingList items={pending} />
          </div>
        </div>
      </div>
    )
  }

  if (role === 'it') {
    return (
      <div className="grid-2" style={{ marginTop: 0 }}>
        <div className="card stack" style={{ marginTop: 0 }}>
          <div className="card-head">
            <h3>Integration exceptions</h3>
          </div>
          <div className="dashboard-panel-body dashboard-panel-scroll">
            <PendingList items={pending} />
          </div>
        </div>
        <div className="card stack" style={{ marginTop: 0 }}>
          <div className="card-head">
            <h3>Integrasi</h3>
          </div>
          <div className="dashboard-panel-body dashboard-panel-center">
            <IntegrationCard
              odooMode={data.integration.odooMode}
              ragflowMode={data.integration.ragflowMode}
            />
          </div>
        </div>
      </div>
    )
  }

  // business
  return (
    <div className="grid-2" style={{ marginTop: 0 }}>
      <div className="card stack" style={{ marginTop: 0 }}>
        <div className="card-head">
          <h3>Status permintaan saya</h3>
        </div>
        <div className="dashboard-panel-body dashboard-panel-scroll">
          <PendingList
            items={data.recentContracts.slice(0, 5).map((c) => ({
              title: c.contract_code,
              sub: `${c.party_code ?? 'Party'} · ${c.status_text}`,
              href: `/parties/${c.party_id}`,
              pill: c.status_text,
              pillClass: c.status,
            }))}
          />
        </div>
      </div>
      <div className="card stack" style={{ marginTop: 0 }}>
        <div className="card-head">
          <h3>Akses Requestor</h3>
        </div>
        <div className="dashboard-panel-body dashboard-panel-center">
          <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
            View-only pada lifecycle. Detail Party lewat menu <Link href="/parties">Parties</Link>.
            Tidak ada CTA create di dashboard.
          </p>
        </div>
      </div>
    </div>
  )
}
