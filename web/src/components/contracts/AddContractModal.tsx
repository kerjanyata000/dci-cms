'use client'

import { ModalCloseButton } from '@/components/ui/icons'
import { useEffect, useMemo, useState } from 'react'
import { createContract, previewContractAi } from '@/lib/contracts/api'
import {
  evaluateGuidelines,
  summarizeGuidelineAlerts,
  type GuidelineAlert,
  type GuidelineCategory,
} from '@/lib/contracts/guidelines'
import type { Contract, ContractMetadata, Party } from '@/types/cms'

type Props = {
  party: Party
  open: boolean
  onClose: () => void
  onCreated: (contract: Contract) => void
}

type Step = 1 | 2 | 3
type OdooDecision = 'confirm' | 'skip'

const CATEGORIES: GuidelineCategory[] = ['Customer', 'Vendor', 'Loan']

function parseDurationMonths(period?: string): string {
  if (!period) return '12'
  const m = period.match(/(\d+)\s*bulan/i)
  if (m) return m[1]
  const y = period.match(/(\d+)\s*tahun/i)
  if (y) return String(Number(y[1]) * 12)
  return '12'
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function pillClass(status: GuidelineAlert['status']) {
  if (status === 'ok') return 'linked'
  if (status === 'warn') return 'pending'
  return 'error'
}

export function AddContractModal({ party, open, onClose, onCreated }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [analyzeMsg, setAnalyzeMsg] = useState('Membaca dokumen…')

  const [contractTitle, setContractTitle] = useState('')
  const [docType, setDocType] = useState('MSA')
  const [category, setCategory] = useState<GuidelineCategory>('Customer')
  const [agreementNo, setAgreementNo] = useState('')
  const [agreementDate, setAgreementDate] = useState(todayIso())
  const [durationMonths, setDurationMonths] = useState('12')
  const [contractValue, setContractValue] = useState('')
  const [counterpartyName, setCounterpartyName] = useState(party.name)
  const [remarks, setRemarks] = useState('')
  const [guidelines, setGuidelines] = useState<GuidelineAlert[]>([])
  const [odooCandidates, setOdooCandidates] = useState<
    Array<{ id: number; name: string; vat?: string | false; ref?: string }>
  >([])
  const [odooDecision, setOdooDecision] = useState<OdooDecision>('skip')
  const [selectedOdooId, setSelectedOdooId] = useState<number | null>(null)
  const [previewMode, setPreviewMode] = useState<'dummy' | 'live' | null>(null)
  const [rawPreview, setRawPreview] = useState<string | null>(null)

  function resetAll() {
    setStep(1)
    setFile(null)
    setBusy(false)
    setError('')
    setContractTitle('')
    setDocType('MSA')
    setCategory('Customer')
    setAgreementNo('')
    setAgreementDate(todayIso())
    setDurationMonths('12')
    setContractValue('')
    setCounterpartyName(party.name)
    setRemarks('')
    setGuidelines([])
    setOdooCandidates([])
    setOdooDecision('skip')
    setSelectedOdooId(null)
    setPreviewMode(null)
    setRawPreview(null)
  }

  useEffect(() => {
    if (open) {
      resetAll()
      setCounterpartyName(party.name)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when opened / party changes
  }, [open, party.id, party.name])

  const guidelineSummary = useMemo(() => summarizeGuidelineAlerts(guidelines), [guidelines])

  if (!open) return null

  function applyExtracted(extracted: ContractMetadata, suggested: GuidelineCategory, text?: string | null) {
    setCategory(suggested)
    setCounterpartyName(extracted.counterpartyName?.trim() || party.name)
    setAgreementNo(extracted.agreementNo ?? '')
    setContractValue(extracted.contractValue ?? '')
    setDurationMonths(parseDurationMonths(extracted.contractPeriod))
    setContractTitle(
      extracted.agreementNo
        ? `${suggested === 'Loan' ? 'Facility' : suggested === 'Vendor' ? 'Vendor Supply' : 'MSA'} — ${extracted.counterpartyName ?? party.name}`
        : `Contract — ${extracted.counterpartyName ?? party.name}`,
    )
    if (suggested === 'Loan') setDocType('Other')
    else if (suggested === 'Vendor') setDocType('Other')
    else setDocType('MSA')

    const alerts = evaluateGuidelines(suggested, {
      extracted,
      rawText: text ?? undefined,
    })
    setGuidelines(alerts)
  }

  async function runAi() {
    if (!file) {
      setError('Pilih file kontrak (PDF/DOCX) dulu.')
      return
    }
    setError('')
    setStep(2)
    setBusy(true)
    setAnalyzeMsg('Ekstraksi metadata…')
    try {
      await new Promise((r) => setTimeout(r, 400))
      setAnalyzeMsg('Klasifikasi tipe & cek guideline…')
      const preview = await previewContractAi(party.id, file)
      setPreviewMode(preview.mode)
      setRawPreview(preview.rawTextPreview)
      setOdooCandidates(preview.odooCandidates ?? [])
      const cat = (preview.suggestedCategory as GuidelineCategory) || 'Customer'
      applyExtracted(preview.extracted, cat, preview.rawTextPreview)
      // Prefer server guidelines (same pack) if returned
      if (preview.guidelines?.length) setGuidelines(preview.guidelines)

      if (preview.odooCandidates?.length) {
        setSelectedOdooId(preview.odooCandidates[0].id)
        setOdooDecision(party.odoo_link_status === 'linked' ? 'skip' : 'confirm')
      } else {
        setSelectedOdooId(null)
        setOdooDecision('skip')
      }
      setStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI preview gagal')
      setStep(1)
    } finally {
      setBusy(false)
    }
  }

  function onCategoryChange(next: GuidelineCategory) {
    setCategory(next)
    setGuidelines(
      evaluateGuidelines(next, {
        extracted: {
          counterpartyName,
          agreementNo,
          contractValue,
          contractPeriod: `${durationMonths} bulan`,
        },
        rawText: rawPreview ?? undefined,
      }),
    )
  }

  async function submit(saveMode: 'draft' | 'review') {
    if (!contractTitle.trim()) {
      setError('Judul kontrak wajib diisi.')
      return
    }
    if (!file) {
      setError('Dokumen wajib di-upload untuk alur AI intake.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const contract = await createContract(party.id, {
        contract_title: contractTitle.trim(),
        doc_type: docType,
        agreement_no: agreementNo.trim() || undefined,
        agreement_date: agreementDate || undefined,
        duration_months: durationMonths ? Number.parseInt(durationMonths, 10) : undefined,
        contract_value: contractValue.trim() || undefined,
        remarks:
          [
            remarks.trim(),
            counterpartyName.trim() && counterpartyName.trim() !== party.name
              ? `Extracted party name: ${counterpartyName.trim()}`
              : '',
          ]
            .filter(Boolean)
            .join('\n') || undefined,
        save_mode: saveMode,
        file,
        guideline_category: category,
        guideline_summary: guidelineSummary,
        odoo_partner_id: odooDecision === 'confirm' ? selectedOdooId : null,
        confirm_odoo_link: odooDecision === 'confirm' && selectedOdooId != null,
      })
      onCreated(contract)
      resetAll()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat kontrak')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div className="modal modal-wide ai-intake-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2>
              {step === 1 ? 'Upload Contract' : step === 2 ? 'AI Analysis' : 'Review AI Result'}
            </h2>
            <p className="muted">
              {party.party_code} — {party.name}
              {previewMode ? ` · extract ${previewMode}` : ''}
            </p>
          </div>
          <ModalCloseButton onClick={onClose} />
        </div>

        <div className="steps" aria-hidden>
          <div className={`step${step >= 1 ? ' done' : ''}`} />
          <div className={`step${step >= 2 ? ' done' : ''}`} />
          <div className={`step${step >= 3 ? ' done' : ''}`} />
        </div>

        {step === 1 && (
          <>
            <div className="notice" style={{ marginBottom: 14 }}>
              <div>
                Upload dokumen dulu. AI mengisi metadata &amp; cek klausul vs guideline{' '}
                <b>Customer / Vendor / Loan</b>. Tidak ada yang auto-save — Anda konfirmasi di
                langkah berikutnya.
              </div>
            </div>
            <div className="field">
              <label htmlFor="ac-file">Dokumen kontrak (PDF / DOCX) *</label>
              <input
                id="ac-file"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file && (
                <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>
                  Dipilih: <b>{file.name}</b>
                </p>
              )}
            </div>
            <p className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
              Tip nama file (mode dummy): sertakan <code>vendor</code> / <code>loan</code> /{' '}
              <code>msa</code> agar klasifikasi &amp; guideline pack ikut berubah.
            </p>
          </>
        )}

        {step === 2 && (
          <div className="ai-analyzing">
            <div className="ai-spin" aria-hidden />
            <b>AI sedang membaca dokumen…</b>
            <span>{analyzeMsg}</span>
          </div>
        )}

        {step === 3 && (
          <>
            <div className="notice" style={{ marginBottom: 14 }}>
              <div>
                Hasil AI di bawah. <b>Edit bebas</b> sebelum simpan. Link Odoo tidak otomatis —
                pilih keputusan Anda.
              </div>
            </div>

            <div className="ai-section">
              <h4>1 · Metadata</h4>
              <div className="grid-2">
                <div className="field">
                  <label htmlFor="ac-title">Contract Title *</label>
                  <input
                    id="ac-title"
                    value={contractTitle}
                    onChange={(e) => setContractTitle(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="ac-type">Document Type</label>
                  <select id="ac-type" value={docType} onChange={(e) => setDocType(e.target.value)}>
                    <option value="MSA">MSA</option>
                    <option value="SLA">SLA</option>
                    <option value="NDA">NDA</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="ac-category">Category guideline</label>
                  <select
                    id="ac-category"
                    value={category}
                    onChange={(e) => onCategoryChange(e.target.value as GuidelineCategory)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="ac-agreement-no">Agreement No</label>
                  <input
                    id="ac-agreement-no"
                    value={agreementNo}
                    onChange={(e) => setAgreementNo(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="ac-date">Agreement Date</label>
                  <input
                    id="ac-date"
                    type="date"
                    value={agreementDate}
                    onChange={(e) => setAgreementDate(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="ac-duration">Duration (months)</label>
                  <input
                    id="ac-duration"
                    type="number"
                    min={1}
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="ac-value">Contract Value</label>
                  <input
                    id="ac-value"
                    value={contractValue}
                    onChange={(e) => setContractValue(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="ac-cp">Party name (extracted)</label>
                  <input
                    id="ac-cp"
                    value={counterpartyName}
                    onChange={(e) => setCounterpartyName(e.target.value)}
                  />
                </div>
              </div>
              {counterpartyName.trim() &&
                counterpartyName.trim().toLowerCase() !== party.name.trim().toLowerCase() && (
                  <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                    Nama hasil ekstraksi berbeda dari Party ini (<b>{party.name}</b>). Kontrak tetap
                    tersimpan di Party saat ini; koreksi nama di sini untuk catatan.
                  </p>
                )}
            </div>

            <div className="ai-section">
              <h4>2 · Party &amp; Odoo</h4>
              {odooCandidates.length > 0 ? (
                <div className="match-box">
                  <div>
                    <b>Usulan Odoo Partner ditemukan</b> (belum Linked — tunggu konfirmasi)
                    <br />
                    <b>{odooCandidates[0].name}</b>
                    {' · '}
                    VAT {odooCandidates[0].vat || '—'}
                    {' · '}
                    ID <span className="mono">{odooCandidates[0].id}</span>
                    {party.odoo_link_status === 'linked' && party.odoo_partner_id != null && (
                      <>
                        <br />
                        Party ini sudah Linked ke #{party.odoo_partner_id}.
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="match-box warn">
                  <div>
                    <b>Tidak ada kandidat Odoo Partner</b> untuk “{counterpartyName || '—'}”.
                    <br />
                    Party tetap di CMS dengan status link saat ini (
                    <span className="mono">{party.odoo_link_status}</span>). Link belakangan setelah
                    Partner dibuat di Odoo.
                  </div>
                </div>
              )}
              <div className="odoo-choice">
                {odooCandidates.length > 0 && (
                  <label>
                    <input
                      type="radio"
                      name="ac-odoo"
                      checked={odooDecision === 'confirm'}
                      onChange={() => {
                        setOdooDecision('confirm')
                        setSelectedOdooId(odooCandidates[0]?.id ?? null)
                      }}
                    />
                    <span>
                      <b>Konfirmasi link</b> ke Partner di atas setelah simpan. CMS tidak membuat
                      Partner di Odoo.
                    </span>
                  </label>
                )}
                <label>
                  <input
                    type="radio"
                    name="ac-odoo"
                    checked={odooDecision === 'skip'}
                    onChange={() => setOdooDecision('skip')}
                  />
                  <span>
                    <b>Jangan link sekarang</b> — simpan kontrak di Party ini; Odoo link menyusul
                    bila perlu.
                  </span>
                </label>
              </div>
            </div>

            <div className="ai-section">
              <h4>3 · Guideline alerts · Pack {category}</h4>
              {guidelines.map((a) => (
                <div className="ai-alert" key={a.clause}>
                  <div className="ai-alert-top">
                    <b>{a.clause}</b>
                    <span className={`status-pill ${pillClass(a.status)}`}>{a.label}</span>
                  </div>
                  <div style={{ color: 'var(--muted)' }}>{a.detail}</div>
                </div>
              ))}
            </div>

            <div className="field">
              <label htmlFor="ac-remarks">Remarks</label>
              <textarea
                id="ac-remarks"
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </>
        )}

        {error && <p className="error-text">{error}</p>}

        <div className="modal-foot">
          {step === 1 && (
            <>
              <button type="button" className="btn ghost" onClick={onClose}>
                Batal
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={busy || !file}
                onClick={() => void runAi()}
              >
                Jalankan AI →
              </button>
            </>
          )}
          {step === 2 && (
            <button type="button" className="btn ghost" disabled>
              Memproses…
            </button>
          )}
          {step === 3 && (
            <>
              <button
                type="button"
                className="btn ghost"
                disabled={busy}
                onClick={() => {
                  setStep(1)
                  setError('')
                }}
              >
                ← Upload ulang
              </button>
              <div className="btn-row">
                <button
                  type="button"
                  className="btn ghost"
                  disabled={busy || !contractTitle.trim()}
                  onClick={() => void submit('review')}
                >
                  {busy ? 'Processing…' : 'Simpan & Under Review →'}
                </button>
                <button
                  type="button"
                  className="btn primary"
                  disabled={busy || !contractTitle.trim()}
                  onClick={() => void submit('draft')}
                >
                  {busy ? 'Processing…' : 'Konfirmasi & Simpan Draft'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
