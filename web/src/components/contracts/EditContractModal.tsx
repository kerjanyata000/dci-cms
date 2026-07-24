'use client'

import { ModalCloseButton } from '@/components/ui/icons'
import { useEffect, useState } from 'react'
import { updateContractAdminDetails } from '@/lib/contracts/api'
import type { Contract } from '@/types/cms'

type Props = {
  contract: Contract
  open: boolean
  onClose: () => void
  onUpdated: (contract: Contract) => void
}

export function EditContractModal({ contract, open, onClose, onUpdated }: Props) {
  const [contractTitle, setContractTitle] = useState(contract.contract_title ?? '')
  const [owner, setOwner] = useState(contract.owner ?? '')
  const [department, setDepartment] = useState(contract.department ?? '')
  const [remarks, setRemarks] = useState(contract.remarks ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setContractTitle(contract.contract_title ?? '')
      setOwner(contract.owner ?? '')
      setDepartment(contract.department ?? '')
      setRemarks(contract.remarks ?? '')
      setError('')
    }
  }, [open, contract])

  if (!open) return null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!contractTitle.trim()) return
    setBusy(true)
    setError('')
    try {
      const updated = await updateContractAdminDetails(contract.id, {
        contract_title: contractTitle.trim(),
        owner: owner.trim() || undefined,
        department: department.trim() || undefined,
        remarks: remarks.trim() || undefined,
      })
      onUpdated(updated)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay" role="presentation">
      <form className="modal modal-wide" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <div>
            <h2>Edit Contract Details</h2>
            <p className="muted">
              FR-CNT-EDIT-001 · BRL-CMS-006 — metadata administratif saja
            </p>
          </div>
          <ModalCloseButton onClick={onClose} />
        </div>

        <div className="field">
          <label>Contract Code</label>
          <input value={contract.contract_code} readOnly />
        </div>

        <div className="field">
          <label htmlFor="ec-title">Internal Title *</label>
          <input
            id="ec-title"
            value={contractTitle}
            onChange={(e) => setContractTitle(e.target.value)}
            required
          />
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="ec-owner">Internal PIC / Owner</label>
            <input id="ec-owner" value={owner} onChange={(e) => setOwner(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="ec-dept">Department</label>
            <input
              id="ec-dept"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="ec-remarks">Notes / Remarks</label>
          <textarea
            id="ec-remarks"
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        <div className="locked-fields card stack" style={{ padding: 12, background: 'var(--paper)' }}>
          <p className="ref-tag" style={{ margin: 0 }}>
            Field terkunci — gunakan aksi terkontrol (FR-CNT-EDIT-003)
          </p>
          <div className="info-grid">
            <div className="info-item locked">
              <span>Counterparty</span>
              <b>{contract.confirmed_metadata.counterpartyName ?? '—'}</b>
            </div>
            <div className="info-item locked">
              <span>Agreement No</span>
              <b>{contract.agreement_no ?? '—'}</b>
            </div>
            <div className="info-item locked">
              <span>Contract Value</span>
              <b>{contract.confirmed_metadata.contractValue ?? '—'}</b>
            </div>
            <div className="info-item locked">
              <span>Period / Expiry</span>
              <b>
                {contract.duration_months ? `${contract.duration_months} bln` : '—'}
                {contract.expiry_date
                  ? ` · ${new Date(contract.expiry_date).toLocaleDateString('id-ID')}`
                  : ''}
              </b>
            </div>
            <div className="info-item locked">
              <span>Status</span>
              <b>{contract.status_text}</b>
            </div>
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="modal-foot">
          <button type="button" className="btn ghost" onClick={onClose} disabled={busy}>
            Batal
          </button>
          <button type="submit" className="btn primary" disabled={busy || !contractTitle.trim()}>
            {busy ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  )
}
