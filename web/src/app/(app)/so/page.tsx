'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { ODOO_MODE } from '@/lib/odoo/client'
import { fetchSyncedOrders, runSoSync, type SyncedOrderRow } from '@/lib/so/api'
import { ROLES } from '@/lib/roles'

export default function SoHealthPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<SyncedOrderRow[]>([])
  const [error, setError] = useState('')
  const [syncMsg, setSyncMsg] = useState('')
  const [busy, setBusy] = useState(false)

  if (!user) return null
  const canSync = ROLES[user.role].canSync || ROLES[user.role].canEdit

  async function load() {
    setError('')
    try {
      setRows(await fetchSyncedOrders())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load SO gagal')
      setRows([])
    }
  }

  async function syncAll() {
    setBusy(true)
    setError('')
    setSyncMsg('')
    try {
      const result = await runSoSync()
      setSyncMsg(
        `Sync selesai — ${result.ordersUpserted} order dari ${result.partiesProcessed} party · ${new Date(result.syncedAt).toLocaleString('id-ID')}`,
      )
      if (result.errors.length) {
        setError(result.errors.slice(0, 3).join(' · '))
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
                <th>State</th>
                <th>Amount</th>
                <th>Synced</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">
                    Belum ada SO tersimpan. Link party ke Odoo lalu Run Sync.
                  </td>
                </tr>
              )}
              {rows.map((o) => (
                <tr key={o.id}>
                  <td className="mono">{o.name}</td>
                  <td>{o.parties?.party_code ?? '—'}</td>
                  <td>{o.state}</td>
                  <td>{o.amount_total ?? '—'}</td>
                  <td className="mono">{new Date(o.synced_at).toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
