'use client'

import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { ODOO_MODE } from '@/lib/odoo/client'
import { searchOrdersFromApi } from '@/lib/odoo/api'
import type { OdooSaleOrder } from '@/lib/odoo/types'
import { ROLES } from '@/lib/roles'

export default function SoHealthPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<OdooSaleOrder[]>([])
  const [error, setError] = useState('')
  if (!user) return null
  const canSync = ROLES[user.role].canSync || ROLES[user.role].canEdit

  async function load() {
    setError('')
    try {
      setRows(
        await searchOrdersFromApi([['state', 'in', ['sale', 'done', 'draft', 'cancel']]], 20),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load SO gagal')
      setRows([])
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>SO Health</h1>
        <p>
          Monitor SO dari Odoo (consume-only, {ODOO_MODE === 'live' ? 'live' : 'dummy'}). Run Sync =
          aksi batch — belum diimplementasi.
        </p>
      </div>
      <div className="card stack">
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn ghost" type="button" onClick={load}>
            Load SO
          </button>
          {canSync && (
            <button
              className="btn primary"
              type="button"
              onClick={() => alert('TODO: server route SO sync batch ke Supabase')}
            >
              Run Sync Now
            </button>
          )}
        </div>
        {error && <p style={{ color: 'var(--danger, #b42318)' }}>{error}</p>}
        <ul className="list">
          {rows.map((o) => (
            <li key={o.id}>
              <span className="mono">{o.name}</span> · state {o.state} · partner{' '}
              {Array.isArray(o.partner_id) ? o.partner_id[1] : o.partner_id}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
