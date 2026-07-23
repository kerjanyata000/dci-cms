'use client'

import { useEffect, useState } from 'react'
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

export default function ActivityPage() {
  const [rows, setRows] = useState<AuditRow[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    cmsFetch('/api/audit')
      .then((r) => r.json())
      .then((p) => {
        if (p.ok) setRows(p.data.logs ?? [])
        else setError(p.error ?? 'Gagal memuat')
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat'))
  }, [])

  return (
    <div>
      <div className="page-head">
        <h1>Activity Log</h1>
        <p>BRL-CMS-025 · audit trail global (80 entri terbaru).</p>
      </div>
      {error && <p className="error-text">{error}</p>}
      <div className="table-wrap card">
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
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  Memuat…
                </td>
              </tr>
            )}
            {rows.map((r) => (
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
  )
}
