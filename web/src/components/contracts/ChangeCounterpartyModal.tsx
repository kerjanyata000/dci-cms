'use client'

import { useEffect, useState } from 'react'
import { changeContractCounterparty } from '@/lib/contracts/api'
import { fetchParties } from '@/lib/parties/api'
import type { Contract, Party } from '@/types/cms'

const CHANGE_TYPES = [
  'Correction',
  'Legal Name Change',
  'Merger / Acquisition',
  'Novation / Party Transfer',
  'Other',
]

type Props = {
  contract: Contract
  currentPartyName: string
  open: boolean
  onClose: () => void
  onApplied: (result: { contract: Contract; redirectPartyId?: string }) => void
}

export function ChangeCounterpartyModal({
  contract,
  currentPartyName,
  open,
  onClose,
  onApplied,
}: Props) {
  const [parties, setParties] = useState<Party[]>([])
  const [toPartyId, setToPartyId] = useState('')
  const [changeType, setChangeType] = useState('Novation / Party Transfer')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setReason('')
    setError('')
    setToPartyId('')
    void fetchParties().then(setParties).catch(() => setParties([]))
  }, [open])

  if (!open) return null

  const blocked = ['waiting_for_signature', 'ready_for_sign'].includes(contract.status)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!toPartyId || !reason.trim()) return
    setBusy(true)
    setError('')
    try {
      const result = await changeContractCounterparty(contract.id, {
        to_party_id: toPartyId,
        change_type: changeType,
        effective_date: effectiveDate || undefined,
        reason: reason.trim(),
      })
      onApplied({
        contract: result.contract,
        redirectPartyId:
          result.contract.party_id !== contract.party_id ? result.contract.party_id : undefined,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Change CP gagal')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay" role="presentation">
      <form className="modal modal-wide" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <div>
            <h2>Change Counterparty</h2>
            <p className="muted">
              FR-CNT-CP-001 · {contract.contract_code} · tanpa approval internal (BRL-CMS-007)
            </p>
          </div>
          <button type="button" className="btn ghost" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="field">
          <label>Current counterparty (locked)</label>
          <input readOnly value={currentPartyName} />
        </div>

        {blocked && (
          <div className="notice">
            <div>
              Kontrak berstatus <b>{contract.status_text}</b> — batalkan proses tanda tangan dulu
              (BRL-CMS-009).
            </div>
          </div>
        )}

        <div className="grid-2">
          <div className="field">
            <label htmlFor="cp-type">Change Type</label>
            <select
              id="cp-type"
              value={changeType}
              onChange={(e) => setChangeType(e.target.value)}
              disabled={blocked}
            >
              {CHANGE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="cp-date">Effective Date</label>
            <input
              id="cp-date"
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              disabled={blocked}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="cp-party">New Counterparty (Party Master) *</label>
          <select
            id="cp-party"
            value={toPartyId}
            onChange={(e) => setToPartyId(e.target.value)}
            required
            disabled={blocked}
          >
            <option value="">Pilih party…</option>
            {parties
              .filter((p) => p.id !== contract.party_id && p.party_status !== 'Inactive')
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.party_code} — {p.name}
                </option>
              ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="cp-reason">Reason *</label>
          <textarea
            id="cp-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            disabled={blocked}
          />
        </div>

        {changeType === 'Correction' && !['draft', 'under_review'].includes(contract.status) && (
          <p className="error-text">Correction hanya untuk Draft / Under Review (BRL-CMS-008).</p>
        )}

        {error && <p className="error-text">{error}</p>}

        <div className="modal-foot">
          <button type="button" className="btn ghost" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="btn primary" disabled={busy || blocked || !toPartyId}>
            {busy ? 'Menyimpan…' : 'Terapkan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  )
}
