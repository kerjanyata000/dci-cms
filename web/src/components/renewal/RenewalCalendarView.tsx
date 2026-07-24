'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { TablePagination, paginateSlice } from '@/components/ui/TablePagination'
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

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']

function decadeLabel(start: number) {
  return `${start}–${start + 8}`
}

const TABLE_PAGE_SIZE = 10
const PICKER_WIDTH = 280

type PickerPos = { top: number; left: number }

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

function FilterDot({ kind }: { kind: 'urgent' | 'soon' | 'later' }) {
  return <span className={`filter-dot ${kind}`} aria-hidden />
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function YearPickerTrigger({
  year,
  expanded,
  onClick,
}: {
  year: number
  expanded: boolean
  onClick: (e: React.MouseEvent) => void
}) {
  return (
    <button
      type="button"
      className="cal-year-hit"
      aria-expanded={expanded}
      aria-label={`Ganti tahun, saat ini ${year}`}
      title="Klik untuk pilih tahun"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={onClick}
    >
      {year}
      <ChevronDownIcon />
    </button>
  )
}

const FILTERS: Array<{ id: Filter; label: string; dot?: 'urgent' | 'soon' | 'later' }> = [
  { id: 'all', label: 'Semua' },
  { id: 'urgent', label: 'Urgent', dot: 'urgent' },
  { id: 'soon', label: 'Segera', dot: 'soon' },
  { id: 'later', label: 'Terjadwal', dot: 'later' },
  { id: 'month', label: 'Bulan tampilan' },
]

export function RenewalCalendarView() {
  const [data, setData] = useState<RenewalPayload | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [cursor, setCursor] = useState(() => {
    const t = new Date()
    return new Date(t.getFullYear(), t.getMonth(), 1)
  })
  const [selectedKey, setSelectedKey] = useState(() => ymdKey(new Date().toISOString()))
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerView, setPickerView] = useState<'month' | 'year'>('month')
  const [decadeStart, setDecadeStart] = useState(() => {
    const y = new Date().getFullYear()
    return y - (y % 9)
  })
  const [tablePage, setTablePage] = useState(1)
  const [pickerPos, setPickerPos] = useState<PickerPos>({ top: 0, left: 0 })
  const [portalReady, setPortalReady] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPortalReady(true)
  }, [])

  const updatePickerPos = useCallback(() => {
    const anchor = anchorRef.current
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    let left = rect.right - PICKER_WIDTH
    left = Math.max(8, Math.min(left, window.innerWidth - PICKER_WIDTH - 8))
    setPickerPos({ top: rect.bottom + 8, left })
  }, [])

  useLayoutEffect(() => {
    if (!pickerOpen) return
    updatePickerPos()
  }, [pickerOpen, pickerView, updatePickerPos])

  useEffect(() => {
    if (!pickerOpen) return
    function onScrollOrResize() {
      updatePickerPos()
    }
    window.addEventListener('resize', onScrollOrResize)
    window.addEventListener('scroll', onScrollOrResize, true)
    return () => {
      window.removeEventListener('resize', onScrollOrResize)
      window.removeEventListener('scroll', onScrollOrResize, true)
    }
  }, [pickerOpen, updatePickerPos])

  useEffect(() => {
    if (!pickerOpen) return
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node
      if (anchorRef.current?.contains(target)) return
      if (pickerRef.current?.contains(target)) return
      setPickerOpen(false)
      setPickerView('month')
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [pickerOpen])

  useEffect(() => {
    fetchRenewalAgenda()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat renewal'))
  }, [])

  useEffect(() => {
    if (!data?.items.length) return
    const today = startOfDay(new Date())
    const upcoming =
      data.items
        .filter((i) => {
          const d = startOfDay(new Date(`${i.eventDate}T00:00:00`))
          return d >= today || i.daysLeft >= -7
        })
        .sort((a, b) => a.eventDate.localeCompare(b.eventDate))[0] ?? data.items[0]
    if (!upcoming) return
    const d = new Date(`${upcoming.eventDate}T00:00:00`)
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1))
    setSelectedKey(ymdKey(upcoming.eventDate))
    setDecadeStart(d.getFullYear() - (d.getFullYear() % 9))
  }, [data])

  function startOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }

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

  useEffect(() => {
    setTablePage(1)
  }, [filter, cursor])

  const tablePageRows = useMemo(
    () => paginateSlice(filteredTable, tablePage, TABLE_PAGE_SIZE),
    [filteredTable, tablePage],
  )

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
    setDecadeStart(t.getFullYear() - (t.getFullYear() % 9))
  }

  function closePicker() {
    setPickerOpen(false)
    setPickerView('month')
  }

  function pickMonth(monthIndex: number) {
    setCursor(new Date(cursor.getFullYear(), monthIndex, 1))
    closePicker()
  }

  function openYearList(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDecadeStart(cursor.getFullYear() - (cursor.getFullYear() % 9))
    setPickerView('year')
  }

  function pickYear(year: number) {
    setCursor(new Date(year, cursor.getMonth(), 1))
    setDecadeStart(year - (year % 9))
    setPickerView('month')
  }

  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  const pickerPanel =
    pickerOpen && portalReady
      ? createPortal(
          <div
            ref={pickerRef}
            className={`cal-picker open cal-picker-portal${pickerView === 'year' ? ' cal-picker-year-mode' : ''}`}
            style={{ top: pickerPos.top, left: pickerPos.left, width: PICKER_WIDTH }}
            role="dialog"
            aria-modal="true"
            aria-label={pickerView === 'month' ? 'Pilih bulan' : 'Pilih tahun'}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {pickerView === 'month' ? (
              <>
                <div className="cal-picker-head">
                  <span className="cal-picker-label">Pilih bulan</span>
                  <YearPickerTrigger
                    year={cursor.getFullYear()}
                    expanded={false}
                    onClick={openYearList}
                  />
                </div>
                <div className="cal-picker-months">
                  {MONTHS_SHORT.map((name, i) => (
                    <button
                      key={name}
                      type="button"
                      className={`${cursor.getMonth() === i ? 'active' : ''}${currentMonth === i && cursor.getFullYear() === currentYear ? ' today-m' : ''}`}
                      onClick={() => pickMonth(i)}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <div className="cal-picker-foot">
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      goToday()
                      closePicker()
                    }}
                  >
                    Bulan ini
                  </button>
                  <button type="button" className="btn primary" onClick={closePicker}>
                    Tutup
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="cal-picker-head cal-picker-head-year">
                  <button type="button" className="cal-picker-back" onClick={() => setPickerView('month')}>
                    ← Bulan
                  </button>
                  <span className="cal-picker-label">Pilih tahun</span>
                </div>
                <div className="cal-picker-year-nav">
                  <button
                    type="button"
                    className="btn ghost cal-picker-nav-btn"
                    aria-label="9 tahun sebelumnya"
                    onClick={() => setDecadeStart((d) => d - 9)}
                  >
                    ‹
                  </button>
                  <span className="cal-picker-range">{decadeLabel(decadeStart)}</span>
                  <button
                    type="button"
                    className="btn ghost cal-picker-nav-btn"
                    aria-label="9 tahun berikutnya"
                    onClick={() => setDecadeStart((d) => d + 9)}
                  >
                    ›
                  </button>
                </div>
                <div className="cal-year-list" role="listbox" aria-label="Daftar tahun">
                  {Array.from({ length: 9 }, (_, i) => decadeStart + i).map((year) => (
                    <button
                      key={year}
                      type="button"
                      role="option"
                      aria-selected={cursor.getFullYear() === year}
                      className={`year-cell${cursor.getFullYear() === year ? ' active' : ''}${currentYear === year ? ' today-m' : ''}`}
                      onClick={() => pickYear(year)}
                    >
                      {year}
                    </button>
                  ))}
                </div>
                <div className="cal-picker-foot">
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      goToday()
                      closePicker()
                    }}
                  >
                    Tahun ini
                  </button>
                  <button type="button" className="btn primary" onClick={closePicker}>
                    Tutup
                  </button>
                </div>
              </>
            )}
          </div>,
          document.body,
        )
      : null

  return (
    <div className="renewal-page">
      <div className="page-head row-actions spread">
        <div>
          <div className="crumb">Registry</div>
          <h1>Renewal &amp; Expiry Calendar</h1>
          <p>FR-DASH-004 · BRL-CMS-023 — agenda renewal, expiry, termination effective date.</p>
        </div>
      </div>

      <div className="notice renewal-notice">
        <InfoIcon />
        <div>
          <b>Metodologi.</b> Estimasi jatuh tempo dari Agreement Date + Duration. Renewal date =
          expiry − 90 hari. Klik tanggal untuk detail agenda; gunakan panah atau picker bulan/tahun.
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      {!data && !error && (
        <div className="renewal-loading" aria-busy="true" aria-label="Memuat agenda renewal">
          <div className="summary-strip">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="summary-chip skeleton-block" />
            ))}
          </div>
          <div className="cal-layout">
            <div className="cal-card skeleton-block" style={{ minHeight: 360 }} />
            <div className="cal-side skeleton-block" style={{ minHeight: 320 }} />
          </div>
        </div>
      )}

      {(data) && (
        <>
      <div className="summary-strip">
        <div className="summary-chip urgent">
          <b>{data?.summary.urgent ?? 0}</b>
          <span>Urgent · ≤30 hari</span>
        </div>
        <div className="summary-chip soon">
          <b>{data?.summary.soon ?? 0}</b>
          <span>Segera · 31–180 hari</span>
        </div>
        <div className="summary-chip later">
          <b>{data?.summary.later ?? 0}</b>
          <span>Terjadwal · &gt;180 hari</span>
        </div>
        <div className="summary-chip month">
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
              <div className="cal-picker-wrap" ref={anchorRef}>
                <button
                  type="button"
                  className={`cal-month-btn${pickerOpen ? ' active' : ''}`}
                  aria-haspopup="dialog"
                  aria-expanded={pickerOpen}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (pickerOpen) {
                      closePicker()
                      return
                    }
                    setPickerView('month')
                    setPickerOpen(true)
                  }}
                >
                  {MONTHS_ID[cursor.getMonth()]} {cursor.getFullYear()}
                </button>
              </div>
            </div>
          </div>
          {pickerPanel}

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

        <aside className="cal-side" aria-label="Agenda tanggal terpilih">
          <div className="cal-side-head">
            <h3>{formatIdDate(selectedKey)}</h3>
            <p className="cal-side-sub">
              {sideEvents.length ? `${sideEvents.length} agenda` : 'Tidak ada agenda di tanggal ini'}
            </p>
          </div>
          <div className="cal-side-list">
            {sideEvents.length === 0 ? (
              <p className="cal-side-empty">
                Pilih tanggal lain di kalender atau tambah kontrak dengan agreement date.
              </p>
            ) : (
              sideEvents.map((e) => (
                <article key={e.id} className="cal-side-item">
                  <div className="row-top">
                    <b>{KIND_LABEL[e.kind]}</b>
                    <span className={`status-pill ${e.bucket}`}>{e.bucket}</span>
                  </div>
                  <div className="meta">
                    {e.partyCode} · {e.contractCode ?? '—'}
                  </div>
                  <Link href={`/parties/${e.partyId}`} className="btn ghost">
                    Party Detail
                  </Link>
                </article>
              ))
            )}
          </div>
        </aside>
      </div>

      <section className="renewal-list-panel" aria-labelledby="renewal-list-title">
        <div className="renewal-list-head">
          <h2 id="renewal-list-title">Daftar agenda</h2>
          <div className="table-toolbar">
            {FILTERS.map(({ id, label, dot }) => (
              <button
                key={id}
                type="button"
                className={`filter-chip clickable${filter === id ? ' active' : ''}`}
                onClick={() => setFilter(id)}
              >
                {dot && <FilterDot kind={dot} />}
                {label}
              </button>
            ))}
          </div>
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
            {tablePageRows.map((row) => (
              <tr key={row.id}>
                <td className="mono">{row.partyCode}</td>
                <td>{row.pic || '—'}</td>
                <td>{KIND_LABEL[row.kind]}</td>
                <td>{row.durationLabel}</td>
                <td>{formatIdDate(row.eventDate)}</td>
                <td>{daysLabel(row.daysLeft)}</td>
                <td>
                  <span className={`status-pill ${row.bucket}`}>{row.bucket}</span>
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

        <TablePagination
          page={tablePage}
          pageSize={TABLE_PAGE_SIZE}
          total={filteredTable.length}
          onPageChange={setTablePage}
          itemLabel="Agenda"
        />
      </section>
        </>
      )}
    </div>
  )
}
