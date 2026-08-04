'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { TablePagination, paginateSlice } from '@/components/ui/TablePagination'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { SaleOrderDetailModal } from '@/components/so/SaleOrderDetailModal'
import { formatCurrency } from '@/lib/format/currency'
import { fetchSyncedOrders, runSoSync, type SoHealthSummary, type SyncedOrderRow } from '@/lib/so/api'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { useAuth } from '@/components/AuthProvider'
import { ROLES } from '@/lib/roles'

function syncStatusLabel(state: string): { label: string; className: string } {
  if (state === 'done') return { label: 'Synchronized', className: 'linked' }
  if (state === 'sale') return { label: 'Confirmed SO', className: 'pending' }
  if (state === 'draft' || state === 'sent') return { label: 'Quotation', className: 'draft' }
  if (state === 'cancel') return { label: 'Cancelled', className: 'draft' }
  return { label: state, className: 'draft' }
}

const STATUS_FILTERS = [
  { value: 'all', label: 'Status: Semua' },
  { value: 'done', label: 'Synchronized' },
  { value: 'sale', label: 'Confirmed SO' },
  { value: 'quote', label: 'Quotation' },
  { value: 'cancel', label: 'Cancelled' },
] as const

const SO_PAGE_SIZE = 10

function matchesStatusFilter(state: string, filter: string) {
  if (filter === 'all') return true
  if (filter === 'quote') return state === 'draft' || state === 'sent'
  return state === filter
}

export default function SoHealthPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<SyncedOrderRow[]>([])
  const [summary, setSummary] = useState<SoHealthSummary | null>(null)
  const [error, setError] = useState('')
  const [syncMsg, setSyncMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [page, setPage] = useState(1)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [partyFilter, setPartyFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [picFilter, setPicFilter] = useState('all')

  const canSync = user ? ROLES[user.role].canSync || ROLES[user.role].canEdit : false

  const partyOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const row of rows) {
      const code = row.parties?.party_code
      if (!code) continue
      map.set(code, row.parties?.name ? `${code} · ${row.parties.name}` : code)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [rows])

  const picOptions = useMemo(() => {
    const set = new Set<string>()
    for (const row of rows) {
      const pic = row.parties?.pic?.trim()
      if (pic) set.add(pic)
    }
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [rows])

  const filteredRows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows.filter((row) => {
      if (partyFilter !== 'all' && row.parties?.party_code !== partyFilter) return false
      if (!matchesStatusFilter(row.state, statusFilter)) return false
      if (picFilter !== 'all' && (row.parties?.pic?.trim() || '') !== picFilter) return false
      if (!needle) return true
      const hay = [
        row.name,
        row.state,
        row.parties?.party_code,
        row.parties?.name,
        row.parties?.pic,
        String(row.odoo_order_id),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(needle)
    })
  }, [rows, q, partyFilter, statusFilter, picFilter])

  const pageRows = useMemo(
    () => paginateSlice(filteredRows, page, SO_PAGE_SIZE),
    [filteredRows, page],
  )

  useEffect(() => {
    setPage(1)
  }, [q, partyFilter, statusFilter, picFilter])

  async function load() {
    setError('')
    setLoading(true)
    try {
      const data = await fetchSyncedOrders()
      setRows(data.orders)
      setSummary(data.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load SO gagal')
      setRows([])
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  async function syncAll() {
    setBusy(true)
    setError('')
    setSyncMsg('')
    try {
      const result = await runSoSync()
      const errSummary =
        result.errors.length > 0
          ? ` · ${result.failedParties} party gagal (${result.errors.length} error)`
          : ''
      setSyncMsg(
        `Sync selesai — ${result.ordersUpserted} order dari ${result.partiesProcessed} party${errSummary} · ${new Date(result.syncedAt).toLocaleString('id-ID')}`,
      )
      if (result.errors.length) {
        setError(result.errors.map((e) => `${e.partyCode}: ${e.message}`).slice(0, 5).join(' · '))
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync gagal')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  if (!user) return null

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="crumb">Registry</div>
          <h1>SO Health</h1>
        </div>
        {canSync && (
          <div className="btn-row">
            <button className="btn primary" type="button" onClick={() => void syncAll()} disabled={busy}>
              {busy ? 'Syncing…' : 'Run Sync Now'}
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="kpi-grid kpi-cols-4" style={{ marginBottom: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="kpi-card kpi-skeleton" aria-hidden />
          ))}
        </div>
      )}

      {!loading && summary && (
        <div className="kpi-grid kpi-cols-4" style={{ marginBottom: 16 }}>
          <KpiCard
            label="Synchronized"
            value={String(summary.synchronized)}
            sub="Party aktif + SO sale/done"
            tone="green"
            icon="sync"
          />
          <KpiCard
            label="No Active SO"
            value={String(summary.noActiveSo)}
            sub="Perlu tindak lanjut"
            tone="amber"
            icon="alert"
          />
          <KpiCard
            label="Quotations"
            value={String(summary.quotations)}
            sub="draft / sent"
            tone="brass"
            icon="quote"
          />
          <KpiCard
            label="Sync Errors (7d)"
            value={String(summary.syncErrors)}
            sub="Error sync"
            tone="red"
            icon="alert"
          />
        </div>
      )}

      <div className="card stack">
        <div className="table-toolbar">
          <label className="toolbar-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="so-q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari SO / party / PIC…"
              aria-label="Cari SO"
            />
          </label>
          <select
            id="so-party-filter"
            className="status-select"
            value={partyFilter}
            onChange={(e) => setPartyFilter(e.target.value)}
            aria-label="Filter party"
          >
            <option value="all">Party: Semua</option>
            {partyOptions.map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
          <select
            id="so-status-filter"
            className="status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter sync status"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <select
            id="so-pic-filter"
            className="status-select"
            value={picFilter}
            onChange={(e) => setPicFilter(e.target.value)}
            aria-label="Filter PIC"
          >
            <option value="all">PIC: Semua</option>
            {picOptions.map((pic) => (
              <option key={pic} value={pic}>
                {pic}
              </option>
            ))}
          </select>
        </div>

        <p className="muted" style={{ margin: 0 }}>
          Klik baris SO untuk melihat detail mirip Quotation / Sales Order (view-only).
        </p>
        {syncMsg && <p className="muted">{syncMsg}</p>}
        {error && <p className="error-text">{error}</p>}
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>SO</th>
                <th>Party</th>
                <th>Sync Status</th>
                <th>Odoo State</th>
                <th>Amount</th>
                <th>Synced</th>
              </tr>
            </thead>
            <tbody>
              {loading && <TableSkeleton rows={5} cols={6} />}
              {!loading && pageRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">
                    {rows.length === 0
                      ? 'Belum ada SO tersimpan. Link party ke Odoo lalu Run Sync.'
                      : 'Tidak ada SO yang cocok dengan pencarian / filter.'}
                  </td>
                </tr>
              )}
              {!loading &&
                pageRows.map((o) => {
                  const st = syncStatusLabel(o.state)
                  return (
                    <tr
                      key={o.id}
                      className="clickable-row"
                      onClick={() => setDetailId(o.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setDetailId(o.id)
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Buka detail ${o.name}`}
                    >
                      <td className="mono">{o.name}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {o.parties?.party_code ? (
                          <Link href={`/parties/${o.party_id}`} className="mono">
                            {o.parties.party_code}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <span className={`status-pill ${st.className}`}>{st.label}</span>
                      </td>
                      <td>{o.state}</td>
                      <td className="mono">{formatCurrency(o.amount_total)}</td>
                      <td className="mono">{new Date(o.synced_at).toLocaleString('id-ID')}</td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          pageSize={SO_PAGE_SIZE}
          total={filteredRows.length}
          onPageChange={setPage}
          itemLabel="SO"
        />
      </div>

      <SaleOrderDetailModal
        open={Boolean(detailId)}
        orderId={detailId}
        onClose={() => setDetailId(null)}
      />
    </div>
  )
}
