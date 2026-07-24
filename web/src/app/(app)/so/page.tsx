'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TablePagination, paginateSlice } from '@/components/ui/TablePagination'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { formatCurrency } from '@/lib/format/currency'
import { fetchSyncedOrders, runSoSync, type SoHealthSummary, type SyncedOrderRow } from '@/lib/so/api'
import { ODOO_MODE } from '@/lib/odoo/client'
import { useAuth } from '@/components/AuthProvider'
import { ROLES } from '@/lib/roles'

function syncStatusLabel(state: string): { label: string; className: string } {
  if (state === 'done') return { label: 'Synchronized', className: 'linked' }
  if (state === 'sale') return { label: 'In Progress', className: 'pending' }
  return { label: state, className: 'draft' }
}

const SO_PAGE_SIZE = 10

export default function SoHealthPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [rows, setRows] = useState<SyncedOrderRow[]>([])
  const [summary, setSummary] = useState<SoHealthSummary | null>(null)
  const [error, setError] = useState('')
  const [syncMsg, setSyncMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [page, setPage] = useState(1)

  const canSync = user ? ROLES[user.role].canSync || ROLES[user.role].canEdit : false
  const pageRows = useMemo(() => paginateSlice(rows, page, SO_PAGE_SIZE), [rows, page])

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
        <div className="crumb">Registry</div>
        <h1>SO Health</h1>
        <p>
          INT-SO · consume-only Odoo ({ODOO_MODE === 'live' ? 'live' : 'dummy'}). Run Sync menarik
          SO ke Supabase mirror — tidak write-back ke Odoo (BR-CMS-020).
        </p>
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
          <div className="kpi-card kpi-green">
            <div className="kpi-top">
              <span className="kpi-label">Synchronized</span>
            </div>
            <div className="kpi-value">{summary.synchronized}</div>
            <div className="kpi-sub up">Party aktif + SO sale/done</div>
          </div>
          <div className="kpi-card kpi-amber">
            <div className="kpi-top">
              <span className="kpi-label">No Active SO</span>
            </div>
            <div className="kpi-value">{summary.noActiveSo}</div>
            <div className="kpi-sub warn">NOTIF-CMS-014</div>
          </div>
          <div className="kpi-card kpi-brass">
            <div className="kpi-top">
              <span className="kpi-label">In Progress</span>
            </div>
            <div className="kpi-value">{summary.inProgress}</div>
            <div className="kpi-sub">State sale (belum done)</div>
          </div>
          <div className="kpi-card kpi-red">
            <div className="kpi-top">
              <span className="kpi-label">Sync Errors (7d)</span>
            </div>
            <div className="kpi-value">{summary.syncErrors}</div>
            <div className="kpi-sub warn">NOTIF-CMS-015</div>
          </div>
        </div>
      )}

      <div className="card stack">
        <div className="row-actions">
          <button className="btn ghost" type="button" onClick={() => void load()} disabled={busy}>
            Refresh
          </button>
          {canSync && (
            <button className="btn primary" type="button" onClick={() => void syncAll()} disabled={busy}>
              {busy ? 'Syncing…' : 'Run Sync Now'}
            </button>
          )}
        </div>
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
                    Belum ada SO tersimpan. Link party ke Odoo lalu Run Sync.
                  </td>
                </tr>
              )}
              {!loading &&
                pageRows.map((o) => {
                const st = syncStatusLabel(o.state)
                const partyHref = o.party_id ? `/parties/${o.party_id}` : null
                return (
                  <tr
                    key={o.id}
                    className={partyHref ? 'clickable-row' : undefined}
                    onClick={partyHref ? () => router.push(partyHref) : undefined}
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
          total={rows.length}
          onPageChange={setPage}
          itemLabel="SO"
        />
      </div>
    </div>
  )
}
