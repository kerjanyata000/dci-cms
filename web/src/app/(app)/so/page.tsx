'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { cmsFetch } from '@/lib/api/http'
import { fetchSyncedOrders, runSoSync, type SoHealthSummary, type SyncedOrderRow } from '@/lib/so/api'
import { ODOO_MODE } from '@/lib/odoo/client'
import { useAuth } from '@/components/AuthProvider'
import { ROLES } from '@/lib/roles'

function syncStatusLabel(state: string): { label: string; className: string } {
  if (state === 'done') return { label: 'Synchronized', className: 'linked' }
  if (state === 'sale') return { label: 'In Progress', className: 'pending' }
  return { label: state, className: 'draft' }
}

export default function SoHealthPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<SyncedOrderRow[]>([])
  const [summary, setSummary] = useState<SoHealthSummary | null>(null)
  const [error, setError] = useState('')
  const [syncMsg, setSyncMsg] = useState('')
  const [busy, setBusy] = useState(false)

  if (!user) return null
  const canSync = ROLES[user.role].canSync || ROLES[user.role].canEdit

  async function load() {
    setError('')
    try {
      const data = await fetchSyncedOrders()
      setRows(data.orders)
      setSummary(data.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load SO gagal')
      setRows([])
      setSummary(null)
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

  return (
    <div>
      <div className="page-head">
        <h1>SO Health</h1>
        <p>
          INT-SO · consume-only Odoo ({ODOO_MODE === 'live' ? 'live' : 'dummy'}). Run Sync menarik
          SO ke Supabase mirror — tidak write-back ke Odoo (BR-CMS-020).
        </p>
      </div>

      {summary && (
        <div className="kpi-grid" style={{ marginBottom: 16 }}>
          <div className="kpi-card tone-green">
            <span className="kpi-label">Synchronized</span>
            <span className="kpi-value">{summary.synchronized}</span>
            <span className="kpi-sub">Party aktif + SO sale/done</span>
          </div>
          <div className="kpi-card tone-amber">
            <span className="kpi-label">No Active SO</span>
            <span className="kpi-value">{summary.noActiveSo}</span>
            <span className="kpi-sub">NOTIF-CMS-014</span>
          </div>
          <div className="kpi-card tone-brass">
            <span className="kpi-label">In Progress</span>
            <span className="kpi-value">{summary.inProgress}</span>
            <span className="kpi-sub">State sale (belum done)</span>
          </div>
          <div className="kpi-card tone-red">
            <span className="kpi-label">Sync Errors (7d)</span>
            <span className="kpi-value">{summary.syncErrors}</span>
            <span className="kpi-sub">NOTIF-CMS-015</span>
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
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">
                    Belum ada SO tersimpan. Link party ke Odoo lalu Run Sync.
                  </td>
                </tr>
              )}
              {rows.map((o) => {
                const st = syncStatusLabel(o.state)
                return (
                  <tr key={o.id}>
                    <td className="mono">{o.name}</td>
                    <td>
                      {o.parties?.party_code ? (
                        <Link href={`/parties/${o.party_id}`} className="mono">
                          {o.parties.party_code}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <span className={`pill pill-${st.className}`}>{st.label}</span>
                    </td>
                    <td>{o.state}</td>
                    <td>{o.amount_total ?? '—'}</td>
                    <td className="mono">{new Date(o.synced_at).toLocaleString('id-ID')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
