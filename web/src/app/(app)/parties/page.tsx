'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { AddPartyModal } from '@/components/parties/AddPartyModal'
import { LinkOdooModal } from '@/components/parties/LinkOdooModal'
import { SortableTh } from '@/components/ui/SortableTh'
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

type SortKey = 'party_code' | 'agreement_date' | 'status'
type SortDir = 'asc' | 'desc'

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

function sortRows(rows: PartyListItem[], key: SortKey, dir: SortDir): PartyListItem[] {
  const mul = dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    let av = ''
    let bv = ''
    if (key === 'party_code') {
      av = a.party_code
      bv = b.party_code
    } else if (key === 'agreement_date') {
      av = a.primary_contract?.agreement_date ?? ''
      bv = b.primary_contract?.agreement_date ?? ''
    } else {
      av = a.primary_contract?.status ?? ''
      bv = b.primary_contract?.status ?? ''
    }
    if (av < bv) return -1 * mul
    if (av > bv) return 1 * mul
    return 0
  })
}

function readLinkFilter(raw: string | null): OdooLinkStatus | 'all' {
  if (!raw || raw === 'all') return 'all'
  const allowed: OdooLinkStatus[] = ['linked', 'pending', 'mismatch', 'unlinked', 'relink']
  return allowed.includes(raw as OdooLinkStatus) ? (raw as OdooLinkStatus) : 'all'
}

export default function PartiesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const canEdit = user ? ROLES[user.role].canEdit : false

  const [rows, setRows] = useState<PartyListItem[]>([])
  const [allPics, setAllPics] = useState<string[]>([])
  const [q, setQ] = useState(() => searchParams.get('q') ?? '')
  const [picFilter, setPicFilter] = useState(() => searchParams.get('pic') ?? 'all')
  const [linkFilter, setLinkFilter] = useState<OdooLinkStatus | 'all'>(() =>
    readLinkFilter(searchParams.get('link')),
  )
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') ?? 'all')
  const [sortKey, setSortKey] = useState<SortKey>(
    () => (searchParams.get('sort') as SortKey) || 'party_code',
  )
  const [sortDir, setSortDir] = useState<SortDir>(
    () => (searchParams.get('dir') as SortDir) || 'asc',
  )
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [addOpen, setAddOpen] = useState(false)
  const [linkParty, setLinkParty] = useState<Party | null>(null)

  useEffect(() => {
    fetchParties({})
      .then((all) => {
        const pics = [...new Set(all.map((p) => p.pic).filter(Boolean))] as string[]
        setAllPics(pics.sort((a, b) => a.localeCompare(b)))
      })
      .catch(() => setAllPics([]))
  }, [])

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
    void load()
  }, [load])

  useEffect(() => {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (linkFilter !== 'all') params.set('link', linkFilter)
    if (picFilter !== 'all') params.set('pic', picFilter)
    if (sortKey !== 'party_code') params.set('sort', sortKey)
    if (sortDir !== 'asc') params.set('dir', sortDir)
    const qs = params.toString()
    router.replace(qs ? `/parties?${qs}` : '/parties', { scroll: false })
  }, [q, statusFilter, linkFilter, picFilter, sortKey, sortDir, router])

  const sortedRows = useMemo(() => sortRows(rows, sortKey, sortDir), [rows, sortKey, sortDir])
  const pageRows = useMemo(() => paginateSlice(sortedRows, page, PAGE_SIZE), [sortedRows, page])

  function toggleSort(key: string) {
    const k = key as SortKey
    if (sortKey === k) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(k)
      setSortDir('asc')
    }
  }

  function upsertParty(updated: Party) {
    setRows((prev) => {
      const i = prev.findIndex((p) => p.id === updated.id)
      if (i < 0) return [{ ...updated, primary_contract: null }, ...prev]
      const next = [...prev]
      next[i] = { ...next[i], ...updated }
      return next
    })
    if (updated.pic && !allPics.includes(updated.pic)) {
      setAllPics((prev) => [...prev, updated.pic!].sort((a, b) => a.localeCompare(b)))
    }
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
          {allPics.map((pic) => (
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
              <SortableTh
                label="Party ID"
                sortKey="party_code"
                activeKey={sortKey}
                dir={sortDir}
                onSort={toggleSort}
              />
              <th>PIC</th>
              <th>Dokumen Utama</th>
              <SortableTh
                label="Agreement Date"
                sortKey="agreement_date"
                activeKey={sortKey}
                dir={sortDir}
                onSort={toggleSort}
              />
              <th>Durasi</th>
              <SortableTh
                label="Status"
                sortKey="status"
                activeKey={sortKey}
                dir={sortDir}
                onSort={toggleSort}
              />
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
                        className="btn ghost small btn-on-row"
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
        total={sortedRows.length}
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
