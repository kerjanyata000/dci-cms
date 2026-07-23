'use client'

import { useState } from 'react'
import { ODOO_MODE } from '@/lib/odoo/client'
import { searchPartnersFromApi } from '@/lib/odoo/api'
import type { OdooPartner } from '@/lib/odoo/types'

export default function PartiesPage() {
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<OdooPartner[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function search() {
    setBusy(true)
    setError('')
    try {
      const domain = q ? [['name', 'ilike', `%${q}%`]] : []
      setRows(await searchPartnersFromApi(domain, 20))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search gagal')
      setRows([])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>Parties</h1>
        <p>
          Inquiry Odoo Partner via server API ({ODOO_MODE === 'live' ? 'live' : 'dummy'}).
          List Party CMS penuh akan dari Supabase.
        </p>
      </div>
      <div className="card stack">
        <div className="field">
          <label htmlFor="q">Cari Odoo Partner</label>
          <input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nama perusahaan…" />
        </div>
        <button className="btn primary" type="button" onClick={search} disabled={busy}>
          {busy ? 'Mencari…' : 'Search Partners'}
        </button>
        {error && <p style={{ color: 'var(--danger, #b42318)' }}>{error}</p>}
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
