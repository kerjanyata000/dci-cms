import { useState } from 'react'
import { getOdooClient } from '../lib/odoo/client'
import type { OdooSaleOrder } from '../lib/odoo/types'
import type { SessionUser } from '../lib/roles'
import { ROLES } from '../lib/roles'

export function SoHealthPage({ user }: { user: SessionUser }) {
  const [rows, setRows] = useState<OdooSaleOrder[]>([])
  const canSync = ROLES[user.role].canSync || ROLES[user.role].canEdit

  async function load() {
    const client = getOdooClient()
    setRows(await client.searchOrders([['state', 'in', ['sale', 'done', 'draft', 'cancel']]], undefined, 20))
  }

  return (
    <div>
      <div className="page-head">
        <h1>SO Health</h1>
        <p>Monitor SO dari Odoo (consume-only). Run Sync = aksi, bukan menu tersendiri.</p>
      </div>
      <div className="card stack">
        <div className="btn-row" style={{ display: 'flex', gap: 8 }}>
          <button className="btn ghost" type="button" onClick={load}>
            Load SO (adapter)
          </button>
          {canSync && (
            <button
              className="btn primary"
              type="button"
              onClick={() => alert('TODO: Edge Function SO sync batch')}
            >
              Run Sync Now
            </button>
          )}
        </div>
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
