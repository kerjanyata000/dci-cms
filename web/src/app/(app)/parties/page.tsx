'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { AddPartyModal } from '@/components/parties/AddPartyModal'
import { LinkOdooModal } from '@/components/parties/LinkOdooModal'
import { fetchParties, type PartyListItem } from '@/lib/parties/api'
import { formatAgreementDate, formatDuration } from '@/lib/parties/list'
import { ODOO_LINK_LABELS } from '@/lib/parties/types'
import { ROLES } from '@/lib/roles'
import type { OdooLinkStatus, Party } from '@/types/cms'

const PAGE_SIZE = 12

const LINK_FILTERS: Array<{ value: OdooLinkStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Semua' },
  { value: 'linked', label: 'Linked' },
  { value: 'pending', label: 'Pending' },
  { value: 'mismatch', label: 'Mismatch' },
  { value: 'unlinked', label: 'Unlinked' },
  { value: 'relink', label: 'Relink' },
]

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Semua status' },
  { value: 'active', label: 'Active' },
  { value: 'fully_signed', label: 'Fully Signed' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'draft', label: 'Draft' },
  { value: 'ready_for_sign', label: 'Ready for Sign' },
]

function contractStatusClass(status: string | undefined): string {
  if (!status) return 'draft'
  if (status === 'under_review') return 'under_review'
  return status
}

export default function PartiesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const canEdit = user ? ROLES[user.role].canEdit : false

  const [rows, setRows] = useState<PartyListItem[]>([])
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [picFilter, setPicFilter] = useState('')
  const [linkFilter, setLinkFilter] = useState<OdooLinkStatus | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [addOpen, setAddOpen] = useState(false)
  const [linkParty, setLinkParty] = useState<Party | null>(null)

  const load = useCallback(async () => {
    setBusy(true)
    setError('')
    try {
      setRows(
        await fetchParties({
          q,
          pic: picFilter || undefined,
          linkStatus: linkFilter,
          contractStatus: statusFilter,
        }),
      )
      setPage(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat parties')
      setRows([])
    } finally {
      setBusy(false)
    }
  }, [q, linkFilter, picFilter, statusFilter])

  useEffect(() => {
    const urlQ = searchParams.get('q')
    if (urlQ != null && urlQ !== q) setQ(urlQ)
  }, [searchParams, q])

  useEffect(() => {
    void load()
  }, [load])

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return rows.slice(start, start + PAGE_SIZE)
  }, [rows, safePage])

  function upsertParty(updated: Party) {
    setRows((prev) => {
      const i = prev.findIndex((p) => p.id === updated.id)
      if (i < 0) return [{ ...updated, primary_contract: null }, ...prev]
      const next = [...prev]
      next[i] = { ...next[i], ...updated }
      return next
    })
  }

  return (
    <div>
      <div className="page-head row-actions spread">
        <div>
          <h1>Parties</h1>
          <p>Register party-centric — kolom kontrak primer dari master agreement (mockup parity).</p>
        </div>
        {canEdit && (
          <button type="button" className="btn primary" onClick={() => setAddOpen(true)}>
            + Add Party
          </button>
        )}
      </div>

      <div className="card stack">
        <div className="row-actions" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div className="field" style={{ flex: '1 1 200px', marginBottom: 0 }}>
            <label htmlFor="party-q">Cari Party</label>
            <input
              id="party-q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nama party…"
            />
          </div>
          <div className="field" style={{ flex: '0 1 140px', marginBottom: 0 }}>
            <label htmlFor="pic-filter">PIC</label>
            <input
              id="pic-filter"
              value={picFilter}
              onChange={(e) => setPicFilter(e.target.value)}
              placeholder="Semua PIC"
            />
          </div>
          <div className="field" style={{ flex: '0 1 160px', marginBottom: 0 }}>
            <label htmlFor="status-filter">Status Kontrak</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ flex: '0 1 160px', marginBottom: 0 }}>
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
                <th>PIC</th>
                <th>Dokumen Utama</th>
                <th>Agreement Date</th>
                <th>Durasi</th>
                <th>Status</th>
                <th>Odoo Link</th>
                <th></th>
                {canEdit && <th></th>}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 9 : 8} className="muted">
                    {busy
                      ? 'Memuat…'
                      : 'Tidak ada party yang cocok. Jalankan npm run seed:demo atau tambah party baru.'}
                  </td>
                </tr>
              )}
              {pageRows.map((p) => {
                const pc = p.primary_contract
                return (
                  <tr
                    key={p.id}
                    className="clickable-row"
                    onClick={() => router.push(`/parties/${p.id}`)}
                  >
                    <td className="mono">{p.party_code}</td>
                    <td>{p.pic || '—'}</td>
                    <td>{pc?.contract_title ?? '—'}</td>
                    <td className="mono">{formatAgreementDate(pc?.agreement_date ?? null)}</td>
                    <td className="mono">{formatDuration(pc?.duration_months ?? null)}</td>
                    <td>
                      {pc ? (
                        <span className={`pill pill-${contractStatusClass(pc.status)}`}>
                          {pc.status_text || pc.status}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="odoo-link-cell">
                        <span className={`pill pill-${p.odoo_link_status}`}>
                          {ODOO_LINK_LABELS[p.odoo_link_status]}
                        </span>
                        {p.odoo_partner_id != null && (
                          <span className="mono odoo-link-id">#{p.odoo_partner_id}</span>
                        )}
                      </div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <Link href={`/parties/${p.id}`} className="btn ghost">
                        Detail
                      </Link>
                    </td>
                    {canEdit && (
                      <td onClick={(e) => e.stopPropagation()}>
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
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="row-actions spread">
          <p className="muted">
            Menampilkan {pageRows.length} dari {rows.length} party
            {rows.length > PAGE_SIZE && ` · halaman ${safePage}/${totalPages}`}
          </p>
          {totalPages > 1 && (
            <div className="pagination-btns">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={n === safePage ? 'active' : ''}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddPartyModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(party) => {
          setRows((prev) => [{ ...party, primary_contract: null }, ...prev])
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
