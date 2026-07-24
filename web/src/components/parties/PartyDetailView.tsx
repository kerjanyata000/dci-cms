'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EditContractModal } from '@/components/contracts/EditContractModal'
import { DocumentDownloadButton } from '@/components/documents/DocumentDownloadButton'
import { AddContractModal } from '@/components/contracts/AddContractModal'
import { AmendmentModal } from '@/components/contracts/AmendmentModal'
import { ChangeCounterpartyModal } from '@/components/contracts/ChangeCounterpartyModal'
import { ContractReviewModal } from '@/components/contracts/ContractReviewModal'
import { TerminationModal } from '@/components/contracts/TerminationModal'
import { UploadSupportingModal } from '@/components/contracts/UploadSupportingModal'
import { ContractRowActions } from '@/components/parties/ContractRowActions'
import { LinkOdooModal } from '@/components/parties/LinkOdooModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { TablePagination, paginateSlice } from '@/components/ui/TablePagination'
import { formatCurrency } from '@/lib/format/currency'
import { fetchSyncedOrders, runSoSync, type SyncedOrderRow } from '@/lib/so/api'
import { fetchPartyDetail, type PartyDetailPayload } from '@/lib/parties/api'
import { ODOO_LINK_HINTS, ODOO_LINK_LABELS, formatOdooLinkSummary } from '@/lib/parties/types'
import type { Contract, ContractMetadata } from '@/types/cms'
import { ACTIVE_FOR_TERM } from '@/lib/contracts/constants'
import { ROLES } from '@/lib/roles'
import type { AppRole } from '@/types/cms'

const AUDIT_PAGE_SIZE = 10

function pickPrimaryContract(contracts: Contract[]): Contract | undefined {
  return (
    contracts.find((c) => ['active', 'fully_signed', 'signed'].includes(c.status)) ?? contracts[0]
  )
}

function contractMeta(c: Contract | undefined): ContractMetadata {
  return (c?.confirmed_metadata ?? {}) as ContractMetadata
}

function partyStatusClass(status: string): string {
  const s = status.toLowerCase().replace(/\s+/g, '_')
  if (s === 'active') return 'active'
  if (s.includes('review')) return 'under_review'
  if (s.includes('termin')) return 'terminated'
  return 'draft'
}

function statusPillClass(status: string | undefined): string {
  if (!status) return 'draft'
  if (status === 'under_review') return 'under_review'
  return status
}

function soSyncClass(state: string): { label: string; className: string } {
  if (state === 'done') return { label: 'Synchronized', className: 'linked' }
  if (state === 'sale') return { label: 'In Progress', className: 'pending' }
  return { label: state, className: 'draft' }
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function InfoField({
  label,
  children,
  locked,
  hint,
}: {
  label: string
  children: ReactNode
  locked?: boolean
  hint?: string
}) {
  return (
    <div className={`info-item${locked ? ' locked' : ''}`}>
      <span className="info-label">
        {locked && <LockIcon />}
        {label}
      </span>
      <div className="info-value">{children}</div>
      {hint && <div className="lock-tag">{hint}</div>}
    </div>
  )
}

function PartyDetailSkeleton() {
  return (
    <div className="party-detail-page" aria-busy="true" aria-label="Memuat party detail">
      <div className="party-crumb skeleton-line" style={{ width: 160, height: 14 }} />
      <div className="dossier-head dossier-skeleton">
        <div className="seal skeleton-block" />
        <div className="dossier-main">
          <div className="skeleton-line" style={{ width: '55%', height: 28 }} />
          <div className="dossier-meta">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton-block" style={{ height: 44 }} />
            ))}
          </div>
        </div>
      </div>
      <div className="tabs-skeleton">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton-block" style={{ width: 96, height: 32 }} />
        ))}
      </div>
    </div>
  )
}

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
  const router = useRouter()
  const canEdit = ROLES[role].canEdit
  const canSync = ROLES[role].canSync || canEdit
  const showSoTab = role !== 'business'

  const [data, setData] = useState<PartyDetailPayload | null>(null)
  const [tab, setTab] = useState<TabId>('overview')
  const [error, setError] = useState('')
  const [linkOpen, setLinkOpen] = useState(false)
  const [addContractOpen, setAddContractOpen] = useState(false)
  const [amendmentContract, setAmendmentContract] = useState<Contract | null>(null)
  const [terminationContract, setTerminationContract] = useState<Contract | null>(null)
  const [reviewContract, setReviewContract] = useState<Contract | null>(null)
  const [cpChangeContract, setCpChangeContract] = useState<Contract | null>(null)
  const [editContract, setEditContract] = useState<Contract | null>(null)
  const [uploadSupportingOpen, setUploadSupportingOpen] = useState(false)
  const [soRows, setSoRows] = useState<SyncedOrderRow[]>([])
  const [soBusy, setSoBusy] = useState(false)
  const [soSyncMsg, setSoSyncMsg] = useState('')
  const [soSyncError, setSoSyncError] = useState('')
  const [auditPage, setAuditPage] = useState(1)

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
    setSoSyncMsg('')
    try {
      const { orders } = await fetchSyncedOrders(partyId)
      setSoRows(orders)
    } finally {
      setSoBusy(false)
    }
  }

  async function handleRunSync() {
    if (!data?.party.odoo_partner_id) return
    setSoBusy(true)
    setSoSyncMsg('')
    setSoSyncError('')
    try {
      const result = await runSoSync(partyId)
      setSoSyncMsg(
        `Sync OK — ${result.ordersUpserted} order(s) · ${new Date(result.syncedAt).toLocaleString('id-ID')}`,
      )
      if (result.errors.length) {
        setSoSyncError(result.errors.map((e) => e.message).join(' · '))
      }
      await loadSo()
      void load()
    } catch (err) {
      setSoSyncError(err instanceof Error ? err.message : 'Sync gagal')
    } finally {
      setSoBusy(false)
    }
  }

  useEffect(() => {
    if (tab === 'so' && data?.party.odoo_partner_id) void loadSo()
  }, [tab, data?.party.odoo_partner_id])

  const auditPageRows = useMemo(
    () => paginateSlice(data?.auditLogs ?? [], auditPage, AUDIT_PAGE_SIZE),
    [data?.auditLogs, auditPage],
  )

  if (error) {
    const notFound = /not found/i.test(error)
    if (notFound) {
      return (
        <EmptyState
          title="Party tidak ditemukan"
          description="ID party tidak ada di register atau Anda tidak memiliki akses (RBAC)."
          primaryAction={{ label: '← Kembali ke Parties', href: '/parties' }}
          secondaryAction={{ label: 'Coba lagi', onClick: () => void load() }}
        />
      )
    }
    return (
      <ErrorBanner message={error} onRetry={() => void load()} />
    )
  }

  if (!data) return <PartyDetailSkeleton />

  const { party, contracts, documents, amendments, terminations, counterpartyChanges, auditLogs, soHealth } = data
  const supportingDocs = documents.filter((d) => d.document_category === 'supporting')
  const contractDocs = documents.filter((d) => d.document_category !== 'supporting')
  const activeContracts = contracts.filter((c) => ACTIVE_FOR_TERM.includes(c.status))
  const sealNo = party.party_code.replace(/^PTY-/i, '')
  const primary = pickPrimaryContract(contracts)
  const meta = contractMeta(primary)
  const visibleTabs = TABS.filter((t) => (t.id === 'so' ? showSoTab : true))

  return (
    <div className="party-detail-page">
      <div className="dossier-sticky-wrap">
      <nav className="party-crumb" aria-label="Breadcrumb">
        <Link href="/parties">Parties</Link>
        <span aria-hidden>/</span>
        <span className="mono">{party.party_code}</span>
      </nav>

      <header className="dossier-head">
        <div className="seal" aria-label={`Party seal ${sealNo}`}>
          <b>{sealNo}</b>
          <span>DCI · Sealed</span>
        </div>
        <div className="dossier-main">
          <div className="dossier-title-row">
            <div>
              <p className="dossier-eyebrow">{formatOdooLinkSummary(party)}</p>
              <h1>{party.name}</h1>
            </div>
            {party.odoo_partner_id != null && (
              <div className={`dossier-odoo-chip link-current-${party.odoo_link_status}`}>
                <span className={`status-pill ${party.odoo_link_status}`}>
                  {ODOO_LINK_LABELS[party.odoo_link_status]}
                </span>
                <span className="mono">res.partner #{party.odoo_partner_id}</span>
              </div>
            )}
          </div>
          {party.odoo_partner_id != null && (
            <p className="dossier-odoo-hint">{ODOO_LINK_HINTS[party.odoo_link_status]}</p>
          )}
          <dl className="dossier-meta">
            <div>
              <dt>Party Code</dt>
              <dd className="mono">{party.party_code}</dd>
            </div>
            <div>
              <dt>PIC</dt>
              <dd>{party.pic || '—'}</dd>
            </div>
            <div>
              <dt>Party Status</dt>
              <dd>
                <span className={`status-pill ${partyStatusClass(party.party_status)}`}>
                  {party.party_status}
                </span>
              </dd>
            </div>
            <div>
              <dt>Contracts</dt>
              <dd>{contracts.length}</dd>
            </div>
          </dl>
        </div>
        <div className="dossier-actions">
          {canEdit ? (
            <>
              <button type="button" className="btn brass" onClick={() => setAddContractOpen(true)}>
                + Add Contract
              </button>
              <button type="button" className="btn ghost dossier-btn-ghost" onClick={() => setLinkOpen(true)}>
                {party.odoo_partner_id != null ? 'Kelola Link Odoo' : 'Link Odoo'}
              </button>
            </>
          ) : (
            <span className="role-badge dossier-viewonly">View-only</span>
          )}
        </div>
      </header>
      </div>

      <div className="tabs-wrap">
        <div className="tabs" role="tablist" aria-label="Party detail sections">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`tab-btn${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' && (
        <div className="tab-panel active party-overview" role="tabpanel">
          <p className="ref-tag">FR-PTY-SV-003 · BRL-CMS-026 — konteks utama kontrak &amp; integrasi</p>

          <section className="overview-section">
            <h2 className="section-title">Contract snapshot</h2>
            <div className="info-grid info-grid-3">
              <InfoField label="Contract Status">
                {primary ? (
                  <span className={`status-pill ${statusPillClass(primary.status)}`}>
                    {primary.status_text || primary.status}
                  </span>
                ) : (
                  '—'
                )}
              </InfoField>
              <InfoField label="Contract Value / MRR">
                <b>{meta.contractValue || '—'}</b>
              </InfoField>
              <InfoField label="Payment Term">
                <b>{meta.paymentTerm || '—'}</b>
              </InfoField>
              <InfoField label="Documents">
                <b>
                  {documents.length} file
                  <span className="info-muted"> ({supportingDocs.length} supporting)</span>
                </b>
              </InfoField>
              <InfoField label="Odoo link">
                <span className={`status-pill ${party.odoo_link_status}`}>
                  {ODOO_LINK_LABELS[party.odoo_link_status]}
                </span>
                {party.odoo_partner_id != null && (
                  <span className="mono info-inline-id">#{party.odoo_partner_id}</span>
                )}
              </InfoField>
              {soHealth.noActiveSo && (
                <InfoField label="SO Health" hint="NOTIF-CMS-014 · FR-CNT-SO-007">
                  <span className="status-pill no_so">No Active SO</span>
                </InfoField>
              )}
            </div>
          </section>

          <section className="overview-section">
            <h2 className="section-title">Sensitive fields</h2>
            <p className="section-desc">
              Field terkontrol — ubah lewat aksi Legal (Change Counterparty, Amendment), bukan edit
              langsung.
            </p>
            <div className="info-grid info-grid-3">
              <InfoField label="Counterparty" locked hint="Change via Change Counterparty (FR-CNT-CP)">
                <b>{party.name}</b>
              </InfoField>
              <InfoField label="Contract Value" locked hint="Change via Amendment">
                <b>{meta.contractValue || '—'}</b>
              </InfoField>
              <InfoField label="Signed Document" locked hint="Not editable directly">
                <b className="mono">{primary ? `${primary.contract_code}-Signed.pdf` : '—'}</b>
              </InfoField>
            </div>
          </section>

          <section className="sub-card overview-terms">
            <h3>Late Payment &amp; Termination Terms</h3>
            <div className="info-grid info-grid-3">
              <InfoField label="Late Payment Penalty">
                <b>{meta.latePaymentPenalty || '—'}</b>
              </InfoField>
              <InfoField label="Early Termination Fee">
                <b>{meta.earlyTerminationFee || '—'}</b>
              </InfoField>
              <InfoField label="Auto-Renewal">
                <b>{meta.autoRenewal || '—'}</b>
              </InfoField>
            </div>
          </section>

          {!canEdit && (
            <div className="readonly-banner party-readonly">
              <LockIcon />
              <div>Role Anda memiliki akses view-only pada Party Detail (FR-CNT-SV-004).</div>
            </div>
          )}
        </div>
      )}

      {tab === 'contracts' && (
        <div className="tab-panel active card stack">
          <p className="ref-tag">FR-CNT-SV-006 · FR-CNT-AMD-008</p>
          {canEdit && contracts.length > 0 && (
            <p className="muted" style={{ fontSize: 12 }}>
              Pilih aksi per baris kontrak di tabel bawah.
            </p>
          )}
          {amendments.length > 0 && (
            <>
              <h3 style={{ margin: '8px 0 0', fontSize: 14 }}>Amendments / Addendum</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Effective</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {amendments.map((a) => (
                    <tr key={a.id}>
                      <td className="mono">{a.amendment_code}</td>
                      <td>{a.title}</td>
                      <td>{a.change_category || '—'}</td>
                      <td>
                        {a.effective_date
                          ? new Date(a.effective_date).toLocaleDateString('id-ID')
                          : '—'}
                      </td>
                      <td>{a.status_text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {contracts.length === 0 ? (
            <p className="muted">Belum ada kontrak untuk party ini. FR-CNT-ADD-009.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contract Code</th>
                  <th>Title</th>
                  <th>Agreement No</th>
                  <th>Type</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th>Validation</th>
                  {canEdit && <th>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id}>
                    <td className="mono">{c.contract_code}</td>
                    <td>{c.contract_title || '—'}</td>
                    <td>{c.agreement_no || '—'}</td>
                    <td>{c.doc_type || '—'}</td>
                    <td>{c.expiry_date ? new Date(c.expiry_date).toLocaleDateString('id-ID') : '—'}</td>
                    <td>
                      <span className={`status-pill ${statusPillClass(c.status)}`}>
                        {c.status_text || c.status}
                      </span>
                    </td>
                    <td>{c.validation_status}</td>
                    {canEdit && (
                      <td>
                        <ContractRowActions
                          contract={c}
                          onReview={() => setReviewContract(c)}
                          onEdit={() => setEditContract(c)}
                          onAmendment={() => setAmendmentContract(c)}
                          onTermination={() => setTerminationContract(c)}
                          onCpChange={() => setCpChangeContract(c)}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'novation' && (
        <div className="tab-panel active card stack">
          <p className="ref-tag">FR-CNT-CP-011 · FR-CNT-SV-007</p>
          {counterpartyChanges.length === 0 ? (
            <p className="muted">Belum ada riwayat Change Counterparty / novation untuk party ini.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contract</th>
                  <th>Type</th>
                  <th>From → To</th>
                  <th>Effective</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {counterpartyChanges.map((ch) => (
                  <tr key={ch.id}>
                    <td className="mono">{ch.contract_code ?? ch.contract_id.slice(0, 8)}</td>
                    <td>{ch.change_type}</td>
                    <td>
                      {ch.from_party_code ?? '—'} → {ch.to_party_code ?? '—'}
                    </td>
                    <td>
                      {ch.effective_date
                        ? new Date(ch.effective_date).toLocaleDateString('id-ID')
                        : '—'}
                    </td>
                    <td>{ch.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}


      {tab === 'termination' && (
        <div className="tab-panel active card stack">
          <p className="ref-tag">FR-CNT-TERM-009 · BRL-CMS-013</p>
          {terminations.length === 0 ? (
            <p className="muted">Belum ada early termination record untuk party ini.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contract</th>
                  <th>Type</th>
                  <th>Effective</th>
                  <th>Status</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {terminations.map((t) => {
                  const parent = contracts.find((c) => c.id === t.contract_id)
                  return (
                    <tr key={t.id}>
                      <td className="mono">{parent?.contract_code ?? t.contract_id.slice(0, 8)}</td>
                      <td>{t.termination_type || '—'}</td>
                      <td>{new Date(t.effective_date).toLocaleDateString('id-ID')}</td>
                      <td>{t.status}</td>
                      <td>{t.reason || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'supporting' && (
        <div className="tab-panel active card stack">
          <p className="ref-tag">FR-CNT-SUP-001</p>
          {canEdit && (
            <button type="button" className="btn ghost" onClick={() => setUploadSupportingOpen(true)}>
              + Upload Supporting Doc
            </button>
          )}
          {supportingDocs.length === 0 ? (
            <p className="muted">Belum ada supporting document untuk party ini.</p>
          ) : (
            <table className="data-table">
              <thead>
                  <tr>
                    <th>File</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
              </thead>
              <tbody>
                {supportingDocs.map((d) => (
                  <tr key={d.id}>
                    <td>{d.file_name}</td>
                    <td>{d.description || '—'}</td>
                    <td>{d.status}</td>
                    <td>
                      <DocumentDownloadButton documentId={d.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {contractDocs.length > 0 && (
            <>
              <h3 style={{ marginTop: 16, fontSize: 14 }}>Contract documents (RAGFlow)</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Status</th>
                    <th>RAGFlow</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {contractDocs.map((d) => (
                    <tr key={d.id}>
                      <td>{d.file_name}</td>
                      <td>{d.status}</td>
                      <td className="mono">
                        {d.ragflow_doc_id ? (
                          <span className="pill">Terindeks</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <DocumentDownloadButton documentId={d.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {tab === 'so' && showSoTab && (
        <div className="tab-panel active card stack">
          <p className="ref-tag">INT-SO · consume-only · BR-CMS-020</p>
          {soHealth.noActiveSo && (
            <div className="notice">
              <div>
                <b>No Active SO / Renewal Not Found</b> — kontrak aktif tanpa SO sale/done di mirror
                (FR-CNT-SO-007 / NOTIF-CMS-014).
              </div>
            </div>
          )}
          {!party.odoo_partner_id ? (
            <p className="muted">Party belum linked ke Odoo Partner — link dulu untuk sync SO.</p>
          ) : (
            <>
              <div className="row-actions">
                <button type="button" className="btn ghost" disabled={soBusy} onClick={() => void loadSo()}>
                  {soBusy ? 'Loading…' : 'Refresh dari Supabase'}
                </button>
                {canSync && (
                  <button
                    type="button"
                    className="btn primary"
                    disabled={soBusy}
                    onClick={() => void handleRunSync()}
                  >
                    Run Sync
                  </button>
                )}
              </div>
              {soSyncMsg && <p className="muted">{soSyncMsg}</p>}
              {soSyncError && <p className="error-text">{soSyncError}</p>}
              {soRows.length === 0 ? (
                <p className="muted">
                  Belum ada SO tersimpan. Jalankan Run Sync untuk pull dari Odoo (consume-only).
                </p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>SO</th>
                      <th>Sync Status</th>
                      <th>Odoo State</th>
                      <th>Amount</th>
                      <th>Synced</th>
                    </tr>
                  </thead>
                  <tbody>
                    {soRows.map((o) => {
                      const st = soSyncClass(o.state)
                      return (
                        <tr key={o.id}>
                          <td className="mono">{o.name}</td>
                          <td>
                            <span className={`status-pill ${st.className}`}>{st.label}</span>
                          </td>
                          <td>{o.state}</td>
                          <td className="mono">{formatCurrency(o.amount_total)}</td>
                          <td className="mono">{new Date(o.synced_at).toLocaleString('id-ID')}</td>
                        </tr>
                      )
                    })}
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
            <>
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
                  {auditPageRows.map((a) => (
                    <tr key={a.id}>
                      <td className="mono">{new Date(a.created_at).toLocaleString('id-ID')}</td>
                      <td>{a.action}</td>
                      <td>{a.action_type || '—'}</td>
                      <td>{a.actor_name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <TablePagination
                page={auditPage}
                pageSize={AUDIT_PAGE_SIZE}
                total={auditLogs.length}
                onPageChange={setAuditPage}
                itemLabel="Entri"
              />
            </>
          )}
        </div>
      )}

      <UploadSupportingModal
        partyId={partyId}
        contracts={contracts}
        open={uploadSupportingOpen}
        onClose={() => setUploadSupportingOpen(false)}
        onUploaded={() => void load()}
      />

      {amendmentContract && (
        <AmendmentModal
          contract={amendmentContract}
          open={Boolean(amendmentContract)}
          onClose={() => setAmendmentContract(null)}
          onCreated={() => {
            setAmendmentContract(null)
            void load()
          }}
        />
      )}

      {terminationContract && (
        <TerminationModal
          contract={terminationContract}
          open={Boolean(terminationContract)}
          onClose={() => setTerminationContract(null)}
          onCreated={() => {
            setTerminationContract(null)
            void load()
          }}
        />
      )}

      {reviewContract && (
        <ContractReviewModal
          contract={reviewContract}
          open={Boolean(reviewContract)}
          onClose={() => setReviewContract(null)}
          onUpdated={(updated) => {
            setReviewContract(updated)
            setData((prev) =>
              prev
                ? {
                    ...prev,
                    contracts: prev.contracts.map((c) => (c.id === updated.id ? updated : c)),
                  }
                : prev,
            )
          }}
        />
      )}

      {cpChangeContract && (
        <ChangeCounterpartyModal
          contract={cpChangeContract}
          currentPartyName={party.name}
          open={Boolean(cpChangeContract)}
          onClose={() => setCpChangeContract(null)}
          onApplied={({ redirectPartyId }) => {
            setCpChangeContract(null)
            if (redirectPartyId && redirectPartyId !== partyId) {
              router.push(`/parties/${redirectPartyId}`)
            } else {
              void load()
            }
          }}
        />
      )}

      {editContract && (
        <EditContractModal
          contract={editContract}
          open={Boolean(editContract)}
          onClose={() => setEditContract(null)}
          onUpdated={(updated) => {
            setEditContract(null)
            setData((prev) =>
              prev
                ? {
                    ...prev,
                    contracts: prev.contracts.map((c) => (c.id === updated.id ? updated : c)),
                  }
                : prev,
            )
          }}
        />
      )}

      <AddContractModal
        party={party}
        open={addContractOpen}
        onClose={() => setAddContractOpen(false)}
        onCreated={(contract: Contract) => {
          setData((prev) =>
            prev ? { ...prev, contracts: [contract, ...prev.contracts] } : prev,
          )
          setAddContractOpen(false)
          void load()
        }}
      />

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
