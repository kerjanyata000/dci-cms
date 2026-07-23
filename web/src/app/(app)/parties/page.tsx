'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { AddPartyModal } from '@/components/parties/AddPartyModal'
import { LinkOdooModal } from '@/components/parties/LinkOdooModal'
import { fetchParties } from '@/lib/parties/api'
import { ODOO_LINK_LABELS } from '@/lib/parties/types'
import { ROLES } from '@/lib/roles'
import type { OdooLinkStatus, Party } from '@/types/cms'

const LINK_FILTERS: Array<{ value: OdooLinkStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Semua' },
  { value: 'linked', label: 'Linked' },
  { value: 'pending', label: 'Pending' },
  { value: 'mismatch', label: 'Mismatch' },
  { value: 'unlinked', label: 'Unlinked' },
  { value: 'relink', label: 'Relink' },
]

export default function PartiesPage() {
  const { user } = useAuth()
  const canEdit = user ? ROLES[user.role].canEdit : false

  const [rows, setRows] = useState<Party[]>([])
  const [q, setQ] = useState('')
  const [linkFilter, setLinkFilter] = useState<OdooLinkStatus | 'all'>('all')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [addOpen, setAddOpen] = useState(false)
  const [linkParty, setLinkParty] = useState<Party | null>(null)

  const load = useCallback(async () => {
    setBusy(true)
    setError('')
    try {
      setRows(await fetchParties({ q, linkStatus: linkFilter }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat parties')
      setRows([])
    } finally {
      setBusy(false)
    }
  }, [q, linkFilter])

  useEffect(() => {
    void load()
  }, [load])

  function upsertParty(updated: Party) {
    setRows((prev) => {
      const i = prev.findIndex((p) => p.id === updated.id)
      if (i < 0) return [updated, ...prev]
      const next = [...prev]
      next[i] = updated
      return next
    })
  }

  return (
    <div>
      <div className="page-head row-actions spread">
        <div>
          <h1>Parties</h1>
          <p>Party master Supabase · drill-in Party Detail (BRL-CMS-026).</p>
        </div>
        {canEdit && (
          <button type="button" className="btn primary" onClick={() => setAddOpen(true)}>
            + Add Party
          </button>
        )}
      </div>

      <div className="card stack">
        <div className="row-actions">
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label htmlFor="party-q">Cari Party</label>
            <input
              id="party-q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nama party…"
            />
          </div>
          <div className="field" style={{ minWidth: 200, marginBottom: 0 }}>
            <label htmlFor="link-filter">Odoo Link</label>
            <select
              id="link-filter"
              value={linkFilter}
              onChange={(e) => setLinkFilter(e.target.value as OdooLinkStatus | 'all')}
            >
              {LINK_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className="btn ghost" disabled={busy} onClick={() => void load()}>
            Refresh
          </button>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Party Code</th>
                <th>Nama</th>
                <th>PIC</th>
                <th>Status</th>
                <th>Odoo Link</th>
                <th>Partner ID</th>
                <th></th>
                {canEdit && <th></th>}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 8 : 7} className="muted">
                    {busy ? 'Memuat…' : 'Belum ada party. Tambah party atau jalankan migration Supabase.'}
                  </td>
                </tr>
              )}
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className="mono">{p.party_code}</td>
                  <td>{p.name}</td>
                  <td>{p.pic || '—'}</td>
                  <td>{p.party_status}</td>
                  <td>
                    <div className="odoo-link-cell">
                      <span className={`pill pill-${p.odoo_link_status}`}>
                        {ODOO_LINK_LABELS[p.odoo_link_status]}
                      </span>
                      {p.odoo_partner_id != null && (
                        <span className="mono odoo-link-id">#{p.odoo_partner_id}</span>
                      )}
                    </div>
                  </td>
                  <td className="mono">{p.odoo_partner_id ?? '—'}</td>
                  <td>
                    <Link href={`/parties/${p.id}`} className="btn ghost">
                      Detail
                    </Link>
                  </td>
                  {canEdit && (
                    <td>
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => setLinkParty(p)}
                      >
                        {p.odoo_partner_id != null ? 'Kelola Link' : 'Link Odoo'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted">Menampilkan {rows.length} party</p>
      </div>

      <AddPartyModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(party) => {
          setRows((prev) => [party, ...prev])
        }}
      />

      {linkParty && (
        <LinkOdooModal
          party={linkParty}
          open={Boolean(linkParty)}
          onClose={() => setLinkParty(null)}
          onLinked={upsertParty}
        />
      )}
    </div>
  )
}
