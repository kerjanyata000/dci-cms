import { useState } from 'react'
import { getOdooClient } from '../lib/odoo/client'
import type { OdooPartner } from '../lib/odoo/types'

export function PartiesPage() {
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<OdooPartner[]>([])
  const [busy, setBusy] = useState(false)

  async function search() {
    setBusy(true)
    try {
      const client = getOdooClient()
      const domain = q ? [['name', 'ilike', `%${q}%`]] : []
      const partners = await client.searchPartners(domain, undefined, 20)
      setRows(partners)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>Parties</h1>
        <p>List Party CMS akan dari Supabase. Sementara: uji inquiry Odoo Partner (dummy/live adapter).</p>
      </div>
      <div className="card stack">
        <div className="field">
          <label htmlFor="q">Cari Odoo Partner (adapter)</label>
          <input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Alpha / Beta / …" />
        </div>
        <button className="btn primary" type="button" onClick={search} disabled={busy}>
          {busy ? 'Mencari…' : 'Search Partners'}
        </button>
        <ul className="list">
          {rows.map((p) => (
            <li key={p.id}>
              <span className="mono">#{p.id}</span> {p.name} · VAT {String(p.vat || '—')} · ref{' '}
              {String(p.ref || '—')}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
