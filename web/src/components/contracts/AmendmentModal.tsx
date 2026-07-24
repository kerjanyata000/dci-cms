'use client'

import { ModalCloseButton } from '@/components/ui/icons'
import { useState } from 'react'
import { createAmendment } from '@/lib/contracts/api'
import type { Contract, ContractAmendment } from '@/types/cms'

type Props = {
  contract: Contract
  open: boolean
  onClose: () => void
  onCreated: (amendment: ContractAmendment) => void
}

const CHANGE_CATEGORIES = ['Commercial', 'Scope', 'Period', 'Legal', 'Other']

export function AmendmentModal({ contract, open, onClose, onCreated }: Props) {
  const [title, setTitle] = useState('')
  const [changeCategory, setChangeCategory] = useState('Commercial')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [reason, setReason] = useState('')
  const [summary, setSummary] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setBusy(true)
    setError('')
    try {
      const amendment = await createAmendment(contract.id, {
        title: title.trim(),
        change_category: changeCategory,
        effective_date: effectiveDate || undefined,
        reason: reason.trim() || undefined,
        summary: summary.trim() || undefined,
      })
      onCreated(amendment)
      setTitle('')
      setEffectiveDate('')
      setReason('')
      setSummary('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat amendment')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <form className="modal modal-wide" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <div>
            <h2>Amendment / Addendum</h2>
            <p className="muted">
              FR-CNT-AMD-001 · Parent {contract.contract_code} — tidak overwrite dokumen asli
            </p>
          </div>
          <ModalCloseButton onClick={onClose} />
        </div>

        <div className="field">
          <label>Parent Contract</label>
          <input value={`${contract.contract_code} — ${contract.contract_title ?? ''}`} readOnly />
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="am-title">Title *</label>
            <input
              id="am-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="am-cat">Change Category</label>
            <select
              id="am-cat"
              value={changeCategory}
              onChange={(e) => setChangeCategory(e.target.value)}
            >
              {CHANGE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="am-date">Effective Date</label>
            <input
              id="am-date"
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="am-reason">Reason / Background</label>
          <textarea id="am-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="am-summary">Summary of Changes</label>
          <textarea id="am-summary" rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} />
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="modal-foot">
          <button type="button" className="btn ghost" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="btn primary" disabled={busy || !title.trim()}>
            {busy ? 'Menyimpan…' : 'Simpan Amendment'}
          </button>
        </div>
      </form>
    </div>
  )
}
