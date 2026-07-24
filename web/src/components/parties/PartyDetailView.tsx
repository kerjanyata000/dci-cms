'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { LinkOdooModal } from '@/components/parties/LinkOdooModal'
import { TablePagination, paginateSlice } from '@/components/ui/TablePagination'
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

function statusPillClass(status: string | undefined): string {
  if (!status) return 'draft'
  if (status === 'under_review') return 'under_review'
  return status
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

  const { party, contracts, documents, amendments, terminations, counterpartyChanges, auditLogs, soHealth } = data
  const supportingDocs = documents.filter((d) => d.document_category === 'supporting')
  const contractDocs = documents.filter((d) => d.document_category !== 'supporting')
  const activeContracts = contracts.filter((c) => ACTIVE_FOR_TERM.includes(c.status))
  const sealNo = party.party_code.replace(/^PTY-/i, '')
  const primary = pickPrimaryContract(contracts)
  const meta = contractMeta(primary)

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
            {formatOdooLinkSummary(party)}
          </div>
          {party.odoo_partner_id != null && (
            <div
              className={`link-current-banner link-current-${party.odoo_link_status}`}
              style={{ marginTop: 10, marginBottom: 0 }}
            >
              <p style={{ margin: 0, fontSize: 13 }}>
                <span className={`status-pill ${party.odoo_link_status}`}>
                  {ODOO_LINK_LABELS[party.odoo_link_status]}
                </span>
                <span className="mono" style={{ marginLeft: 8 }}>
                  Odoo res.partner #{party.odoo_partner_id}
                </span>
              </p>
              <p className="muted" style={{ margin: '6px 0 0', fontSize: 12 }}>
                {ODOO_LINK_HINTS[party.odoo_link_status]}
              </p>
            </div>
          )}
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
              <button type="button" className="btn brass" onClick={() => setAddContractOpen(true)}>
                + Add Contract
              </button>
              <button type="button" className="btn ghost" onClick={() => setLinkOpen(true)}>
                {party.odoo_partner_id != null ? 'Kelola Link Odoo' : 'Link Odoo'}
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
        <div className="tab-panel active stack">
          <p className="ref-tag">FR-PTY-SV-003 · BRL-CMS-026 — konteks utama kontrak & integrasi</p>
          <div className="info-grid">
            <div className="info-item">
              <span>Contract Status</span>
              <b>
                {primary ? (
                  <span className={`status-pill ${statusPillClass(primary.status)}`}>
                    {primary.status_text || primary.status}
                  </span>
                ) : (
                  '—'
                )}
              </b>
            </div>
            <div className="info-item">
              <span>Contract Value / MRR</span>
              <b>{meta.contractValue || '—'}</b>
            </div>
            <div className="info-item">
              <span>Payment Term</span>
              <b>{meta.paymentTerm || '—'}</b>
            </div>
            <div className="info-item locked">
              <span>Counterparty (locked)</span>
              <b>{party.name}</b>
              <div className="lock-tag">Change via Change Counterparty (FR-CNT-CP)</div>
            </div>
            <div className="info-item locked">
              <span>Contract Value (locked)</span>
              <b>{meta.contractValue || '—'}</b>
              <div className="lock-tag">Change via Amendment</div>
            </div>
            <div className="info-item locked">
              <span>Signed Document (locked)</span>
              <b className="mono">
                {primary ? `${primary.contract_code}-Signed.pdf` : '—'}
              </b>
              <div className="lock-tag">Not editable directly</div>
            </div>
            <div className="info-item">
              <span>Odoo link</span>
              <b>
                <span className={`status-pill ${party.odoo_link_status}`}>
                  {ODOO_LINK_LABELS[party.odoo_link_status]}
                </span>
                {party.odoo_partner_id != null && (
                  <span className="mono" style={{ marginLeft: 8 }}>
                    #{party.odoo_partner_id}
                  </span>
                )}
              </b>
            </div>
            <div className="info-item">
              <span>Documents</span>
              <b>
                {documents.length} file ({supportingDocs.length} supporting)
              </b>
            </div>
            {soHealth.noActiveSo && (
              <div className="info-item locked">
                <span>SO Health</span>
                <b>
                  <span className="status-pill no_so">No Active SO</span>
                </b>
                <div className="lock-tag">NOTIF-CMS-014 · FR-CNT-SO-007</div>
              </div>
            )}
          </div>

          <div className="sub-card">
            <h3>Late Payment &amp; Termination Terms</h3>
            <div className="info-grid">
              <div className="info-item">
                <span>Late Payment Penalty</span>
                <b>{meta.latePaymentPenalty || '—'}</b>
              </div>
              <div className="info-item">
                <span>Early Termination Fee</span>
                <b>{meta.earlyTerminationFee || '—'}</b>
              </div>
              <div className="info-item">
                <span>Auto-Renewal</span>
                <b>{meta.autoRenewal || '—'}</b>
              </div>
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
                        <div className="row-actions contract-actions">
                          <button
                            type="button"
                            className="btn ghost"
                            onClick={() => setReviewContract(c)}
                          >
                            Review
                          </button>
                          <button
                            type="button"
                            className="btn ghost"
                            onClick={() => setEditContract(c)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn ghost"
                            onClick={() => setAmendmentContract(c)}
                          >
                            AMD
                          </button>
                          {ACTIVE_FOR_TERM.includes(c.status) && (
                            <button
                              type="button"
                              className="btn ghost"
                              onClick={() => setTerminationContract(c)}
                            >
                              Term
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn ghost"
                            onClick={() => setCpChangeContract(c)}
                          >
                            CP
                          </button>
                        </div>
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
                      <th>State</th>
                      <th>Amount</th>
                      <th>Synced</th>
                    </tr>
                  </thead>
                  <tbody>
                    {soRows.map((o) => (
                      <tr key={o.id}>
                        <td className="mono">{o.name}</td>
                        <td>{o.state}</td>
                        <td>{o.amount_total ?? '—'}</td>
                        <td className="mono">{new Date(o.synced_at).toLocaleString('id-ID')}</td>
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
