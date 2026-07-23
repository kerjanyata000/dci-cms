'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { fetchRenewalAgenda, type RenewalPayload } from '@/lib/renewal/api'
import type { RenewalAgendaItem } from '@/lib/renewal/types'

type Filter = 'all' | 'urgent' | 'soon' | 'later' | 'month'

const KIND_LABEL: Record<string, string> = {
  renewal: 'Renewal',
  expiry: 'Expiry',
  termination: 'Termination',
}

const MONTHS_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

function ymdKey(iso: string) {
  return iso.slice(0, 10)
}

function formatIdDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function daysLabel(days: number) {
  if (days < 0) return `${Math.abs(days)} hari lalu`
  if (days === 0) return 'Hari ini'
  return `${days} hari lagi`
}

export function RenewalCalendarView() {
  const [data, setData] = useState<RenewalPayload | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [cursor, setCursor] = useState(() => {
    const t = new Date()
    return new Date(t.getFullYear(), t.getMonth(), 1)
  })
  const [selectedKey, setSelectedKey] = useState(() => ymdKey(new Date().toISOString()))

  useEffect(() => {
    fetchRenewalAgenda()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat renewal'))
  }, [])

  const items = data?.items ?? []

  const filteredTable = useMemo(() => {
    const month = cursor.getMonth()
    const year = cursor.getFullYear()
    return items.filter((item) => {
      if (filter === 'urgent') return item.bucket === 'urgent'
      if (filter === 'soon') return item.bucket === 'soon'
      if (filter === 'later') return item.bucket === 'later'
      if (filter === 'month') {
        const d = new Date(`${item.eventDate}T00:00:00`)
        return d.getMonth() === month && d.getFullYear() === year
      }
      return true
    })
  }, [items, filter, cursor])

  const eventsByKey = useMemo(() => {
    const map = new Map<string, RenewalAgendaItem[]>()
    for (const item of items) {
      const key = ymdKey(item.eventDate)
      const list = map.get(key) ?? []
      list.push(item)
      map.set(key, list)
    }
    return map
  }, [items])

  const calCells = useMemo(() => {
    const y = cursor.getFullYear()
    const m = cursor.getMonth()
    const first = new Date(y, m, 1)
    const startOffset = (first.getDay() + 6) % 7
    const start = new Date(y, m, 1 - startOffset)
    const cells: Array<{ date: Date; inMonth: boolean; key: string }> = []
    for (let i = 0; i < 42; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      cells.push({
        date,
        inMonth: date.getMonth() === m,
        key: ymdKey(date.toISOString()),
      })
    }
    return cells
  }, [cursor])

  const todayKey = ymdKey(new Date().toISOString())
  const sideEvents = eventsByKey.get(selectedKey) ?? []

  function goToday() {
    const t = new Date()
    setCursor(new Date(t.getFullYear(), t.getMonth(), 1))
    setSelectedKey(ymdKey(t.toISOString()))
  }

  return (
    <div>
      <div className="page-head row-actions spread">
        <div>
          <div className="crumb">Registry</div>
          <h1>Renewal &amp; Expiry Calendar</h1>
          <p>FR-DASH-004 · BRL-CMS-023 — agenda renewal, expiry, termination effective date.</p>
        </div>
      </div>

      <div className="notice">
        <div>
          <b>Metodologi.</b> Estimasi jatuh tempo dari Agreement Date + Duration. Renewal date =
          expiry − 90 hari. Data dari kontrak Supabase + termination records.
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="summary-strip">
        <div className="summary-chip urgent">
          <b>{data?.summary.urgent ?? 0}</b>
          <span>Urgent · ≤30 hari</span>
        </div>
        <div className="summary-chip soon">
          <b>{data?.summary.soon ?? 0}</b>
          <span>Segera · 31–180 hari</span>
        </div>
        <div className="summary-chip">
          <b>{data?.summary.later ?? 0}</b>
          <span>Terjadwal · &gt;180 hari</span>
        </div>
        <div className="summary-chip">
          <b>{data?.summary.inMonth ?? 0}</b>
          <span>Di bulan ini</span>
        </div>
      </div>

      <div className="cal-layout">
        <div className="cal-card">
          <div className="cal-toolbar">
            <div className="cal-nav">
              <button
                type="button"
                className="btn ghost"
                onClick={() =>
                  setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
                }
              >
                ‹
              </button>
              <button type="button" className="btn ghost" onClick={goToday}>
                Bulan ini
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() =>
                  setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
                }
              >
                ›
              </button>
            </div>
            <div className="cal-jump">
              <span className="cal-month-btn">
                {MONTHS_ID[cursor.getMonth()]} {cursor.getFullYear()}
              </span>
            </div>
          </div>

          <div className="cal-weekdays">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="cal-grid">
            {calCells.map((cell) => {
              const evts = eventsByKey.get(cell.key) ?? []
              return (
                <button
                  key={cell.key}
                  type="button"
                  className={`cal-cell${cell.inMonth ? '' : ' out'}${cell.key === todayKey ? ' today' : ''}${cell.key === selectedKey ? ' selected' : ''}`}
                  onClick={() => setSelectedKey(cell.key)}
                >
                  <span className="cal-daynum">{cell.date.getDate()}</span>
                  <div className="cal-events">
                    {evts.slice(0, 2).map((e) => (
                      <span key={e.id} className={`cal-evt ${e.bucket}`}>
                        {e.partyCode}
                      </span>
                    ))}
                    {evts.length > 2 && <span className="cal-more">+{evts.length - 2}</span>}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="cal-legend">
            <span>
              <i className="lg-urgent" /> Urgent ≤30h
            </span>
            <span>
              <i className="lg-soon" /> Segera 31–180h
            </span>
            <span>
              <i className="lg-later" /> Terjadwal
            </span>
            <span>
              <i className="lg-today" /> Hari ini
            </span>
          </div>
        </div>

        <div className="cal-side">
          <h3>{formatIdDate(selectedKey)}</h3>
          <p className="cal-side-sub">
            {sideEvents.length ? `${sideEvents.length} agenda` : 'Tidak ada agenda di tanggal ini'}
          </p>
          {sideEvents.length === 0 ? (
            <p className="cal-side-empty">Pilih tanggal lain di kalender atau tambah kontrak dengan agreement date.</p>
          ) : (
            sideEvents.map((e) => (
              <div key={e.id} className="cal-side-item">
                <div className="row-top">
                  <b>{KIND_LABEL[e.kind]}</b>
                  <span className={`pill pill-${e.bucket}`}>{e.bucket}</span>
                </div>
                <div className="meta">
                  {e.partyCode} · {e.contractCode ?? '—'}
                </div>
                <Link href={`/parties/${e.partyId}`} className="btn ghost">
                  Party Detail
                </Link>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="table-toolbar">
        {(
          [
            ['all', 'Semua'],
            ['urgent', '🔴 Urgent'],
            ['soon', '🟠 Segera'],
            ['later', '⚪ Terjadwal'],
            ['month', 'Bulan tampilan'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`filter-chip clickable${filter === id ? ' active' : ''}`}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Party</th>
              <th>PIC</th>
              <th>Jenis</th>
              <th>Durasi</th>
              <th>Tanggal</th>
              <th>Sisa Waktu</th>
              <th>Urgensi</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredTable.length === 0 && (
              <tr>
                <td colSpan={8} className="muted">
                  {data ? 'Belum ada agenda — buat kontrak dengan agreement date & duration.' : 'Memuat…'}
                </td>
              </tr>
            )}
            {filteredTable.map((row) => (
              <tr key={row.id}>
                <td className="mono">{row.partyCode}</td>
                <td>{row.pic || '—'}</td>
                <td>{KIND_LABEL[row.kind]}</td>
                <td>{row.durationLabel}</td>
                <td>{formatIdDate(row.eventDate)}</td>
                <td>{daysLabel(row.daysLeft)}</td>
                <td>
                  <span className={`pill pill-${row.bucket}`}>{row.bucket}</span>
                </td>
                <td>
                  <Link href={`/parties/${row.partyId}`} className="btn ghost">
                    Detail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
