'use client'

import { ModalCloseButton } from '@/components/ui/icons'
import { useState } from 'react'
import { createTermination } from '@/lib/contracts/api'
import type { Contract, ContractTermination } from '@/types/cms'

type Props = {
  contract: Contract
  open: boolean
  onClose: () => void
  onCreated: (termination: ContractTermination) => void
}

export function TerminationModal({ contract, open, onClose, onCreated }: Props) {
  const [terminationType, setTerminationType] = useState('Early Termination')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [reason, setReason] = useState('')
  const [summary, setSummary] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!effectiveDate) return
    setBusy(true)
    setError('')
    try {
      const termination = await createTermination(contract.id, {
        termination_type: terminationType,
        effective_date: effectiveDate,
        reason: reason.trim() || undefined,
        summary: summary.trim() || undefined,
      })
      onCreated(termination)
      setEffectiveDate('')
      setReason('')
      setSummary('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat termination')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <form className="modal modal-wide" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <div>
            <h2>Early Termination</h2>
            <p className="muted">
              FR-CNT-TERM-001 · BRL-CMS-013 · Hanya kontrak Active · tanpa approval internal
            </p>
          </div>
          <ModalCloseButton onClick={onClose} />
        </div>

        <div className="field">
          <label>Parent Contract</label>
          <input value={`${contract.contract_code} — ${contract.status_text}`} readOnly />
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="term-type">Termination Type</label>
            <input
              id="term-type"
              value={terminationType}
              onChange={(e) => setTerminationType(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="term-date">Effective Date *</label>
            <input
              id="term-date"
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="term-reason">Reason</label>
          <textarea id="term-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="term-summary">Outstanding Obligations / Summary</label>
          <textarea id="term-summary" rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} />
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="modal-foot">
          <button type="button" className="btn ghost" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="btn primary" disabled={busy || !effectiveDate}>
            {busy ? 'Menyimpan…' : 'Submit Termination'}
          </button>
        </div>
      </form>
    </div>
  )
}
