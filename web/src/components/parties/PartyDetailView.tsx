'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { LinkOdooModal } from '@/components/parties/LinkOdooModal'
import { searchOrdersFromApi } from '@/lib/odoo/api'
import { fetchPartyDetail, type PartyDetailPayload } from '@/lib/parties/api'
import { ODOO_LINK_LABELS } from '@/lib/parties/types'
import type { OdooSaleOrder } from '@/lib/odoo/types'
import { ROLES } from '@/lib/roles'
import type { AppRole } from '@/types/cms'

const TABS = [
  { id: 'overview', label: 'Overview', brd: 'FR-PTY-SV-003' },
  { id: 'contracts', label: 'Contracts & Amendments', brd: 'FR-CNT-SV-006' },
  { id: 'novation', label: 'Novation / CP Change', brd: 'FR-CNT-CP-011' },
  { id: 'termination', label: 'Early Termination', brd: 'FR-CNT-TERM-009' },
  { id: 'supporting', label: 'Supporting Docs', brd: 'FR-CNT-SUP-001' },
  { id: 'so', label: 'SO Synchronization', brd: 'INT-SO / FR-PTY-SV-003' },
  { id: 'audit', label: 'Audit Trail', brd: 'BRL-CMS-025' },
] as const

type TabId = (typeof TABS)[number]['id']

type Props = {
  partyId: string
  role: AppRole
}

export function PartyDetailView({ partyId, role }: Props) {
  const canEdit = ROLES[role].canEdit
  const canSync = ROLES[role].canSync || canEdit
  const showSoTab = role !== 'business'

  const [data, setData] = useState<PartyDetailPayload | null>(null)
  const [tab, setTab] = useState<TabId>('overview')
  const [error, setError] = useState('')
  const [linkOpen, setLinkOpen] = useState(false)
  const [soRows, setSoRows] = useState<OdooSaleOrder[]>([])
  const [soBusy, setSoBusy] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try {
      setData(await fetchPartyDetail(partyId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat party')
    }
  }, [partyId])

  useEffect(() => {
    void load()
  }, [load])

  async function loadSo() {
    if (!data?.party.odoo_partner_id) return
    setSoBusy(true)
    try {
      setSoRows(
        await searchOrdersFromApi(
          [['partner_id', '=', data.party.odoo_partner_id]],
          20,
        ),
      )
    } finally {
      setSoBusy(false)
    }
  }

  useEffect(() => {
    if (tab === 'so' && data?.party.odoo_partner_id) void loadSo()
  }, [tab, data?.party.odoo_partner_id])

  if (error) {
    return (
      <div>
        <p className="error-text">{error}</p>
        <Link href="/parties" className="btn ghost">
          ← Kembali ke Parties
        </Link>
      </div>
    )
  }

  if (!data) return <p className="muted">Memuat party detail…</p>

  const { party, contracts, documents, auditLogs } = data
  const sealNo = party.party_code.replace(/^PTY-/i, '')

  return (
    <div>
      <div className="crumb">
        <Link href="/parties">Parties</Link> / <span>{party.party_code}</span>
      </div>

      <div className="dossier-head">
        <div className="seal">
          <b>{sealNo}</b>
          <span>DCI · Sealed</span>
        </div>
        <div className="dossier-info">
          <div className="crumb-w">
            Odoo Partner · {ODOO_LINK_LABELS[party.odoo_link_status]}
            {party.odoo_partner_id != null && (
              <span className="mono"> · #{party.odoo_partner_id}</span>
            )}
          </div>
          <h1>{party.name}</h1>
          <div className="dossier-meta">
            <div>
              <span>Party Code</span>
              <b className="mono">{party.party_code}</b>
            </div>
            <div>
              <span>PIC</span>
              <b>{party.pic || '—'}</b>
            </div>
            <div>
              <span>Party Status</span>
              <b>{party.party_status}</b>
            </div>
            <div>
              <span>Contracts</span>
              <b>{contracts.length}</b>
            </div>
          </div>
        </div>
        <div className="dossier-actions">
          {canEdit ? (
            <>
              <button type="button" className="btn brass" disabled title="Fase berikutnya">
                + Add Contract
              </button>
              <button type="button" className="btn ghost" onClick={() => setLinkOpen(true)}>
                Link Odoo
              </button>
            </>
          ) : (
            <span className="role-badge">View-only</span>
          )}
        </div>
      </div>

      <div className="tabs" role="tablist">
        {TABS.filter((t) => (t.id === 'so' ? showSoTab : true)).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            className={`tab-btn${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="tab-panel active card stack">
          <p className="ref-tag">FR-PTY-SV-003 · BRL-CMS-026 — konteks utama kontrak & integrasi</p>
          <div className="info-grid">
            <div className="info-item">
              <span>Legal name</span>
              <b>{party.name}</b>
            </div>
            <div className="info-item locked">
              <span>Counterparty (locked)</span>
              <b>{party.name}</b>
              <div className="lock-tag">Change via Change Counterparty (FR-CNT-CP)</div>
            </div>
            <div className="info-item">
              <span>Odoo link</span>
              <b>
                <span className={`pill pill-${party.odoo_link_status}`}>
                  {ODOO_LINK_LABELS[party.odoo_link_status]}
                </span>
              </b>
            </div>
            <div className="info-item">
              <span>Documents</span>
              <b>{documents.length} file</b>
            </div>
          </div>
          {!canEdit && (
            <div className="readonly-banner">
              Role Anda memiliki akses view-only pada Party Detail (FR-CNT-SV-004).
            </div>
          )}
        </div>
      )}

      {tab === 'contracts' && (
        <div className="tab-panel active card stack">
          <p className="ref-tag">FR-CNT-SV-006 · FR-CNT-AMD-008</p>
          {canEdit && (
            <div className="row-actions">
              <button type="button" className="btn ghost" disabled>
                + Amendment (soon)
              </button>
              <button type="button" className="btn ghost" disabled>
                Early Termination (soon)
              </button>
            </div>
          )}
          {contracts.length === 0 ? (
            <p className="muted">Belum ada kontrak untuk party ini. FR-CNT-ADD-009.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contract Code</th>
                  <th>Agreement No</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Validation</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id}>
                    <td className="mono">{c.contract_code}</td>
                    <td>{c.agreement_no || '—'}</td>
                    <td>{c.doc_type || '—'}</td>
                    <td>
                      <span className="pill">{c.status_text || c.status}</span>
                    </td>
                    <td>{c.validation_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'novation' && (
        <div className="tab-panel active card">
          <p className="ref-tag">FR-CNT-CP-011 · BRL-CMS-028</p>
          <p className="muted">
            Riwayat novation / counterparty change akan ditampilkan di sini setelah modul lifecycle
            diimplementasi. Data tetap linked ke parent contract per BRD.
          </p>
        </div>
      )}

      {tab === 'termination' && (
        <div className="tab-panel active card">
          <p className="ref-tag">FR-CNT-TERM-009 · BRL-CMS-013</p>
          <p className="muted">
            Early termination history untuk kontrak Active — belum ada record. Termination hanya
            dari kontrak Active (BRL-CMS-013).
          </p>
        </div>
      )}

      {tab === 'supporting' && (
        <div className="tab-panel active card stack">
          <p className="ref-tag">FR-CNT-SUP-001</p>
          {documents.length === 0 ? (
            <p className="muted">Belum ada supporting document / file vault untuk party ini.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Status</th>
                  <th>RAGFlow doc</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d.id}>
                    <td>{d.file_name}</td>
                    <td>{d.status}</td>
                    <td className="mono">{d.ragflow_doc_id || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'so' && showSoTab && (
        <div className="tab-panel active card stack">
          <p className="ref-tag">INT-SO · consume-only · BR-CMS-020</p>
          {!party.odoo_partner_id ? (
            <p className="muted">Party belum linked ke Odoo Partner — link dulu untuk sync SO.</p>
          ) : (
            <>
              <div className="row-actions">
                <button type="button" className="btn ghost" disabled={soBusy} onClick={() => void loadSo()}>
                  {soBusy ? 'Loading…' : 'Refresh SO dari Odoo'}
                </button>
                {canSync && (
                  <button type="button" className="btn primary" disabled title="Batch sync — fase berikutnya">
                    Run Sync
                  </button>
                )}
              </div>
              {soRows.length === 0 ? (
                <p className="muted">Tidak ada SO ditemukan untuk partner #{party.odoo_partner_id}.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>SO</th>
                      <th>State</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {soRows.map((o) => (
                      <tr key={o.id}>
                        <td className="mono">{o.name}</td>
                        <td>{o.state}</td>
                        <td>{o.amount_total ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'audit' && (
        <div className="tab-panel active card stack">
          <p className="ref-tag">BRL-CMS-025 · Activity Log konteks Party</p>
          {auditLogs.length === 0 ? (
            <p className="muted">Belum ada audit log untuk party ini.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Aksi</th>
                  <th>Tipe</th>
                  <th>Actor</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((a) => (
                  <tr key={a.id}>
                    <td className="mono">{new Date(a.created_at).toLocaleString('id-ID')}</td>
                    <td>{a.action}</td>
                    <td>{a.action_type || '—'}</td>
                    <td>{a.actor_name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <LinkOdooModal
        party={party}
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        onLinked={(updated) => {
          setData((prev) => (prev ? { ...prev, party: updated } : prev))
          setLinkOpen(false)
        }}
      />
    </div>
  )
}
