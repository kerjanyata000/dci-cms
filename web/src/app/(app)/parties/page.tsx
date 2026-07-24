'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { AddPartyModal } from '@/components/parties/AddPartyModal'
import { LinkOdooModal } from '@/components/parties/LinkOdooModal'
import { TablePagination, paginateSlice } from '@/components/ui/TablePagination'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { fetchParties, type PartyListItem } from '@/lib/parties/api'
import { formatAgreementDate, formatDuration } from '@/lib/parties/list'
import { ODOO_LINK_LABELS } from '@/lib/parties/types'
import { ROLES } from '@/lib/roles'
import type { OdooLinkStatus, Party } from '@/types/cms'

const PAGE_SIZE = 8

const LINK_FILTERS: Array<{ value: OdooLinkStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Odoo Link: Semua' },
  { value: 'linked', label: 'Linked' },
  { value: 'pending', label: 'Pending Odoo Link' },
  { value: 'mismatch', label: 'Mismatch' },
  { value: 'unlinked', label: 'Unlinked' },
  { value: 'relink', label: 'Relink Required' },
]

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Semua Status' },
  { value: 'active', label: 'Active' },
  { value: 'fully_signed', label: 'Fully Signed' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'draft', label: 'Draft' },
  { value: 'ready_for_sign', label: 'Ready for Sign' },
  { value: 'terminated', label: 'Terminated' },
]

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function contractStatusClass(status: string | undefined): string {
  if (!status) return 'draft'
  if (status === 'under_review') return 'under_review'
  return status
}

function odooStatusClass(status: OdooLinkStatus): string {
  if (status === 'linked') return 'linked'
  if (status === 'mismatch' || status === 'relink') return status
  if (status === 'pending' || status === 'unlinked') return status
  return 'pending'
}

export default function PartiesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const canEdit = user ? ROLES[user.role].canEdit : false

  const [rows, setRows] = useState<PartyListItem[]>([])
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [picFilter, setPicFilter] = useState('all')
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
          pic: picFilter !== 'all' ? picFilter : undefined,
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

  const picOptions = useMemo(() => {
    const pics = [...new Set(rows.map((p) => p.pic).filter(Boolean))] as string[]
    return pics.sort((a, b) => a.localeCompare(b))
  }, [rows])

  const pageRows = useMemo(() => paginateSlice(rows, page, PAGE_SIZE), [rows, page])

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
          <div className="crumb">Parties</div>
          <h1>Parties — Search &amp; View</h1>
          <p>
            Inquiry party-centric per BRD §6.11 — register, kontrak primer, link Odoo, dan Party
            Detail.
          </p>
        </div>
        {canEdit && (
          <button type="button" className="btn primary" onClick={() => setAddOpen(true)}>
            + Add New Party
          </button>
        )}
      </div>

      <div className="table-toolbar">
        <select
          id="status-filter"
          className="status-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          id="link-filter"
          className="status-select"
          value={linkFilter}
          onChange={(e) => setLinkFilter(e.target.value as OdooLinkStatus | 'all')}
        >
          {LINK_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          id="pic-filter"
          className="status-select"
          value={picFilter}
          onChange={(e) => setPicFilter(e.target.value)}
        >
          <option value="all">PIC: Semua</option>
          {picOptions.map((pic) => (
            <option key={pic} value={pic}>
              {pic}
            </option>
          ))}
        </select>
        <input
          id="party-q"
          className="status-select"
          style={{ flex: '1 1 180px', minWidth: 160 }}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama party…"
          aria-label="Cari party"
        />
        <button type="button" className="btn ghost" disabled={busy} onClick={() => void load()}>
          Refresh
        </button>
        <span className="filter-count-chip">
          Menampilkan {pageRows.length} dari {rows.length} party
        </span>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Party ID</th>
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
            {busy && rows.length === 0 && (
              <TableSkeleton rows={PAGE_SIZE} cols={canEdit ? 9 : 8} />
            )}
            {!busy && pageRows.length === 0 && (
              <tr>
                <td colSpan={canEdit ? 9 : 8} className="muted">
                  Tidak ada party yang cocok. Jalankan npm run seed:demo atau tambah party baru.
                </td>
              </tr>
            )}
            {!busy &&
              pageRows.map((p) => {
              const pc = p.primary_contract
              return (
                <tr
                  key={p.id}
                  className="clickable-row"
                  onClick={() => router.push(`/parties/${p.id}`)}
                >
                  <td className="mono">{p.party_code}</td>
                  <td>
                    {p.pic ? (
                      <span className="row-flex">
                        <span className="avatar-sm">{initials(p.pic)}</span>
                        {p.pic}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{pc?.contract_title ?? '—'}</td>
                  <td className="mono">{formatAgreementDate(pc?.agreement_date ?? null)}</td>
                  <td className="mono">{formatDuration(pc?.duration_months ?? null)}</td>
                  <td>
                    {pc ? (
                      <span className={`status-pill ${contractStatusClass(pc.status)}`}>
                        {pc.status_text || pc.status}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <span className={`status-pill ${odooStatusClass(p.odoo_link_status)}`}>
                      {ODOO_LINK_LABELS[p.odoo_link_status]}
                    </span>
                    {p.odoo_partner_id != null && (
                      <span className="mono odoo-link-id"> #{p.odoo_partner_id}</span>
                    )}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="btn ghost small"
                      style={{ background: '#fff' }}
                      onClick={() => router.push(`/parties/${p.id}`)}
                    >
                      Lihat →
                    </button>
                  </td>
                  {canEdit && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn ghost small"
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

      <TablePagination
        page={page}
        pageSize={PAGE_SIZE}
        total={rows.length}
        onPageChange={setPage}
        itemLabel="Party"
      />

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
