'use client'

import { ModalCloseButton } from '@/components/ui/icons'
import { useState } from 'react'
import { createContract } from '@/lib/contracts/api'
import type { Contract, Party } from '@/types/cms'

type Props = {
  party: Party
  open: boolean
  onClose: () => void
  onCreated: (contract: Contract) => void
}

const DOC_TYPES = ['MSA', 'SLA', 'NDA', 'Other']

export function AddContractModal({ party, open, onClose, onCreated }: Props) {
  const [contractTitle, setContractTitle] = useState('')
  const [docType, setDocType] = useState('MSA')
  const [agreementNo, setAgreementNo] = useState('')
  const [agreementDate, setAgreementDate] = useState('')
  const [durationMonths, setDurationMonths] = useState('12')
  const [contractValue, setContractValue] = useState('')
  const [owner, setOwner] = useState('')
  const [department, setDepartment] = useState('')
  const [remarks, setRemarks] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  async function submit(saveMode: 'draft' | 'review') {
    if (!contractTitle.trim()) return
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
        owner: owner.trim() || undefined,
        department: department.trim() || undefined,
        remarks: remarks.trim() || undefined,
        save_mode: saveMode,
        file,
      })
      onCreated(contract)
      setContractTitle('')
      setAgreementNo('')
      setAgreementDate('')
      setContractValue('')
      setOwner('')
      setDepartment('')
      setRemarks('')
      setFile(null)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat kontrak')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2>Add Contract</h2>
            <p className="muted">
              FR-CNT-ADD-001/003/004 · {party.party_code} — {party.name}
            </p>
          </div>
          <ModalCloseButton onClick={onClose} />
        </div>

        <p className="ref-tag">Counterparty locked · {party.name} (BRL-CMS-006)</p>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="ac-title">Contract Title *</label>
            <input
              id="ac-title"
              value={contractTitle}
              onChange={(e) => setContractTitle(e.target.value)}
              placeholder="Master Service Agreement"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="ac-type">Document Type</label>
            <select id="ac-type" value={docType} onChange={(e) => setDocType(e.target.value)}>
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
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
              placeholder="IDR …"
            />
          </div>
          <div className="field">
            <label htmlFor="ac-owner">Owner</label>
            <input id="ac-owner" value={owner} onChange={(e) => setOwner(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="ac-dept">Department</label>
            <input
              id="ac-dept"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="ac-file">Contract Document (PDF/DOCX) — FR-CNT-ADD-003</label>
          <input
            id="ac-file"
            type="file"
            accept=".pdf,.doc,.docx,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <p className="muted" style={{ marginTop: 4, fontSize: 12 }}>
            PDF/DOCX disimpan ke <b>Supabase Storage</b> (bucket <code>contracts</code>) dan diindeks ke{' '}
            <b>RAGFlow</b> untuk ekstraksi metadata + smart search kontrak CMS.
          </p>
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

        {error && <p className="error-text">{error}</p>}

        <div className="modal-foot">
          <button type="button" className="btn ghost" onClick={onClose}>
            Batal
          </button>
          <button
            type="button"
            className="btn ghost"
            disabled={busy || !contractTitle.trim()}
            onClick={() => void submit('draft')}
          >
            {busy ? 'Processing…' : 'Simpan Draft'}
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={busy || !contractTitle.trim()}
            onClick={() => void submit('review')}
          >
            {busy ? 'Processing…' : 'Simpan Under Review'}
          </button>
        </div>
      </div>
    </div>
  )
}
