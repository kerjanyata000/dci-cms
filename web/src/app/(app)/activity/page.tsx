'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { cmsFetch } from '@/lib/api/http'

type AuditRow = {
  id: string
  action: string
  action_type: string | null
  actor_name: string | null
  party_id: string | null
  created_at: string
}

const TYPE_FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: 'create', label: 'Create' },
  { value: 'amendment', label: 'Amendment' },
  { value: 'sync', label: 'SO Sync' },
  { value: 'sync_error', label: 'Sync Error' },
  { value: 'cp', label: 'CP Change' },
  { value: 'termination', label: 'Termination' },
  { value: 'link', label: 'Odoo Link' },
]

export default function ActivityPage() {
  const [rows, setRows] = useState<AuditRow[]>([])
  const [error, setError] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    cmsFetch('/api/audit')
      .then((r) => r.json())
      .then((p) => {
        if (p.ok) setRows(p.data.logs ?? [])
        else setError(p.error ?? 'Gagal memuat')
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat'))
  }, [])

  const visible = useMemo(() => {
    if (typeFilter === 'all') return rows
    return rows.filter((r) => r.action_type === typeFilter)
  }, [rows, typeFilter])

  function exportCsv() {
    const header = ['created_at', 'action', 'action_type', 'actor_name', 'party_id']
    const lines = [
      header.join(','),
      ...visible.map((r) =>
        [r.created_at, r.action, r.action_type ?? '', r.actor_name ?? '', r.party_id ?? '']
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(','),
      ),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cms-activity-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="page-head row-actions spread">
        <div>
          <h1>Activity Log</h1>
          <p>BRL-CMS-025 · audit trail global (80 entri terbaru).</p>
        </div>
        <button type="button" className="btn ghost" onClick={exportCsv} disabled={visible.length === 0}>
          Export CSV
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
      <div className="card stack">
        <div className="row-actions" style={{ flexWrap: 'wrap', gap: 8 }}>
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`btn ghost ${typeFilter === f.value ? 'active' : ''}`}
              onClick={() => setTypeFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Aksi</th>
                <th>Tipe</th>
                <th>Actor</th>
                <th>Party</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">
                    {rows.length === 0 ? 'Memuat…' : 'Tidak ada entri untuk filter ini.'}
                  </td>
                </tr>
              )}
              {visible.map((r) => (
                <tr key={r.id}>
                  <td className="mono">{new Date(r.created_at).toLocaleString('id-ID')}</td>
                  <td>{r.action}</td>
                  <td>{r.action_type ?? '—'}</td>
                  <td>{r.actor_name ?? '—'}</td>
                  <td>
                    {r.party_id ? (
                      <Link href={`/parties/${r.party_id}`} className="mono">
                        Detail
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
