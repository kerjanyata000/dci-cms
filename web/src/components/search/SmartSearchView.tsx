'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { runSearch } from '@/lib/search/api'
import type { SearchScope } from '@/lib/search/server'
import type { SmartSearchResult } from '@/lib/search/server'
import { RAGFLOW_MODE } from '@/lib/ragflow/client'

const SCOPES: Array<{ id: SearchScope; label: string }> = [
  { id: 'all', label: 'Semua' },
  { id: 'parties', label: 'Party' },
  { id: 'contracts', label: 'Kontrak' },
  { id: 'content', label: 'Isi Dokumen' },
]

const STATUS_FILTERS = [
  { value: '', label: 'Semua status' },
  { value: 'draft', label: 'Draft' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'active', label: 'Active' },
  { value: 'terminated', label: 'Terminated' },
]

const EXAMPLE_QUERIES = ['Customer ABC', 'MSA', 'perpanjangan otomatis', 'PTY-00006']

function contractStatusClass(status: string): string {
  if (status === 'under_review') return 'under_review'
  return status
}

function readScope(raw: string | null): SearchScope {
  const allowed: SearchScope[] = ['all', 'parties', 'contracts', 'content']
  return allowed.includes(raw as SearchScope) ? (raw as SearchScope) : 'all'
}

type Props = {
  canEdit: boolean
}

export function SmartSearchView({ canEdit }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [q, setQ] = useState(() => searchParams.get('q') ?? '')
  const [scope, setScope] = useState<SearchScope>(() => readScope(searchParams.get('scope')))
  const [status, setStatus] = useState(() => searchParams.get('status') ?? '')
  const [docType, setDocType] = useState(() => searchParams.get('docType') ?? '')
  const [result, setResult] = useState<SmartSearchResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const execute = useCallback(async () => {
    const term = q.trim()
    if (!term) {
      setResult(null)
      return
    }
    setBusy(true)
    setError('')
    try {
      setResult(
        await runSearch({
          q: term,
          scope,
          status: status || undefined,
          docType: docType || undefined,
          semantic: scope === 'content' || scope === 'all',
        }),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pencarian gagal')
      setResult(null)
    } finally {
      setBusy(false)
    }
  }, [q, scope, status, docType])

  useEffect(() => {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (scope !== 'all') params.set('scope', scope)
    if (status) params.set('status', status)
    if (docType.trim()) params.set('docType', docType.trim())
    const qs = params.toString()
    router.replace(qs ? `/search?${qs}` : '/search', { scroll: false })
  }, [q, scope, status, docType, router])

  useEffect(() => {
    if (q.trim()) void execute()
    else setResult(null)
  }, [execute, q])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    void execute()
  }

  function pickExample(sample: string) {
    setQ(sample)
  }

  const total =
    (result?.parties.length ?? 0) +
    (result?.contracts.length ?? 0) +
    (result?.contentHits.length ?? 0)

  return (
    <div>
      <div className="page-head">
        <div className="crumb">Registry</div>
        <h1>Smart Search</h1>
        <p>
          FR-CNT-SV-003 · BRL-CMS-003 — metadata Party/Kontrak + isi dokumen terindeks (RAGFlow).
        </p>
      </div>

      <form className="card stack search-form" onSubmit={submit}>
        <div className="search-form-main">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama party, PIC, agreement no, contract code, owner, isi kontrak…"
            aria-label="Kata kunci pencarian"
            autoFocus
          />
          <button type="submit" className="btn primary" disabled={busy || !q.trim()}>
            {busy ? 'Mencari…' : 'Cari'}
          </button>
        </div>

        <div className="search-tags">
          {SCOPES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`filter-chip clickable${scope === s.id ? ' active' : ''}`}
              onClick={() => setScope(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {(scope === 'all' || scope === 'contracts') && (
          <div className="row-actions">
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <label htmlFor="search-status">Status kontrak</label>
              <select
                id="search-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUS_FILTERS.map((f) => (
                  <option key={f.value || 'all'} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <label htmlFor="search-doctype">Tipe dokumen</label>
              <input
                id="search-doctype"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                placeholder="MSA, PO, Amendment…"
              />
            </div>
          </div>
        )}

        <p className="muted" style={{ fontSize: 12 }}>
          Mode RAGFlow: {RAGFLOW_MODE.toUpperCase()}
          {canEdit ? '' : ' · Role view-only — hasil mengikuti akses baca (RBAC penuh setelah Auth)'}
        </p>
      </form>

      {error && <p className="error-text">{error}</p>}

      {!q.trim() && !busy && !result && (
        <div className="search-empty-state card stack">
          <h2>Cari di registry kontrak</h2>
          <p className="muted">
            Gunakan kata kunci party, PIC, nomor agreement, kode kontrak, atau isi dokumen yang
            terindeks RAGFlow.
          </p>
          <div className="search-empty-examples">
            <span className="muted">Contoh pencarian:</span>
            {EXAMPLE_QUERIES.map((sample) => (
              <button
                key={sample}
                type="button"
                className="filter-chip clickable"
                onClick={() => pickExample(sample)}
              >
                {sample}
              </button>
            ))}
          </div>
        </div>
      )}

      {busy && (
        <div className="search-results-skeleton stack" aria-busy="true" aria-label="Mencari">
          <div className="skeleton-line" style={{ width: 180, height: 14 }} />
          <div className="card stack">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton-block" style={{ height: 48 }} />
            ))}
          </div>
        </div>
      )}

      {result && !busy && (
        <div className="stack" style={{ marginTop: 16 }}>
          <p className="muted">
            {total} hasil untuk &ldquo;{result.query}&rdquo;
            {result.semanticUsed && result.semanticError && (
              <span className="error-text"> · Semantic: {result.semanticError}</span>
            )}
          </p>

          {(scope === 'all' || scope === 'parties') && result.parties.length > 0 && (
            <section className="card stack">
              <h2 style={{ margin: 0, fontSize: 16 }}>Parties ({result.parties.length})</h2>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Nama</th>
                    <th>PIC</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {result.parties.map((p) => (
                    <tr key={p.id}>
                      <td className="mono">{p.party_code}</td>
                      <td>{p.name}</td>
                      <td>{p.pic || '—'}</td>
                      <td>{p.party_status}</td>
                      <td>
                        <Link href={`/parties/${p.id}`} className="btn ghost">
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {(scope === 'all' || scope === 'contracts') && result.contracts.length > 0 && (
            <section className="card stack">
              <h2 style={{ margin: 0, fontSize: 16 }}>Kontrak ({result.contracts.length})</h2>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Title</th>
                    <th>Party</th>
                    <th>Agreement No</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {result.contracts.map((c) => (
                    <tr key={c.id}>
                      <td className="mono">{c.contract_code}</td>
                      <td>{c.contract_title || '—'}</td>
                      <td>{c.party_name}</td>
                      <td>{c.agreement_no || '—'}</td>
                      <td>
                        <span className={`status-pill ${contractStatusClass(c.status)}`}>
                          {c.status_text}
                        </span>
                      </td>
                      <td>
                        <Link href={`/parties/${c.party_id}`} className="btn ghost">
                          Party Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {(scope === 'all' || scope === 'content') && result.contentHits.length > 0 && (
            <section className="card stack">
              <h2 style={{ margin: 0, fontSize: 16 }}>
                Isi dokumen ({result.contentHits.length})
              </h2>
              {result.contentHits.map((hit, i) => (
                <div key={`${hit.docId}-${i}`} className="search-content-hit">
                  <div className="search-content-meta">
                    <b>{hit.party_name ?? 'Dokumen CMS'}</b>
                    {hit.contract_code && (
                      <span className="mono" style={{ marginLeft: 8 }}>
                        {hit.contract_code}
                      </span>
                    )}
                    {hit.file_name && (
                      <span className="muted" style={{ marginLeft: 8 }}>
                        {hit.file_name}
                      </span>
                    )}
                    <span className="muted" style={{ marginLeft: 8 }}>
                      score {(hit.score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="search-content-snippet">
                    {(hit.displayContent ?? hit.content).slice(0, 320)}
                    {(hit.displayContent ?? hit.content).length > 320 ? '…' : ''}
                  </p>
                  {hit.party_id && (
                    <Link href={`/parties/${hit.party_id}`} className="btn ghost">
                      Buka Party
                    </Link>
                  )}
                </div>
              ))}
            </section>
          )}

          {total === 0 && (
            <div className="card">
              <p className="muted">Tidak ada hasil. Coba kata kunci lain atau scope berbeda.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
