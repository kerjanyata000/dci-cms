'use client'

import { ModalCloseButton } from '@/components/ui/icons'
import { useEffect, useState } from 'react'
import { transitionAmendmentStatus } from '@/lib/contracts/api'
import type { Contract, ContractAmendment } from '@/types/cms'

type Props = {
  amendment: ContractAmendment
  parentContract?: Contract | null
  open: boolean
  onClose: () => void
  onUpdated: (amendment: ContractAmendment) => void
}

const STATUS_ACTIONS: Array<{
  action: string
  label: string
  showWhen: string[]
}> = [
  { action: 'submit_review', label: 'Submit Review', showWhen: ['draft'] },
  { action: 'ready_for_sign', label: 'Ready for Signature', showWhen: ['draft', 'under_review'] },
  { action: 'mark_fully_signed', label: 'Mark Fully Signed', showWhen: ['ready_for_sign'] },
  { action: 'back_to_draft', label: 'Back to Draft', showWhen: ['under_review', 'ready_for_sign'] },
  { action: 'cancel', label: 'Cancel Amendment', showWhen: ['draft', 'under_review', 'ready_for_sign'] },
]

function statusPillClass(status: string): string {
  if (status === 'fully_signed') return 'fully_signed'
  if (status === 'ready_for_sign') return 'ready_for_sign'
  if (status === 'under_review') return 'under_review'
  if (status === 'cancelled') return 'terminated'
  return 'draft'
}

export function AmendmentReviewModal({
  amendment,
  parentContract,
  open,
  onClose,
  onUpdated,
}: Props) {
  const [current, setCurrent] = useState(amendment)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setCurrent(amendment)
      setError('')
    }
  }, [open, amendment])

  if (!open) return null

  const actions = STATUS_ACTIONS.filter((a) => a.showWhen.includes(current.status))

  async function runStatus(action: string) {
    if (action === 'cancel' && !window.confirm(`Batalkan ${current.amendment_code}?`)) return
    if (
      action === 'mark_fully_signed' &&
      !window.confirm(
        `Tandai ${current.amendment_code} Fully Signed? Ringkasan parent contract akan di-update (dokumen asli tetap).`,
      )
    ) {
      return
    }

    setBusy(true)
    setError('')
    try {
      const updated = await transitionAmendmentStatus(
        current.parent_contract_id,
        current.id,
        action,
      )
      setCurrent(updated)
      onUpdated(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status gagal')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2>Review Amendment</h2>
            <p className="muted">
              FR-CNT-AMD-005 · {current.amendment_code}
              {parentContract ? ` · parent ${parentContract.contract_code}` : ''}
            </p>
          </div>
          <ModalCloseButton onClick={onClose} />
        </div>

        <div className="grid-2">
          <div className="field">
            <label>Title</label>
            <input value={current.title} readOnly />
          </div>
          <div className="field">
            <label>Status</label>
            <div>
              <span className={`status-pill ${statusPillClass(current.status)}`}>
                {current.status_text}
              </span>
            </div>
          </div>
          <div className="field">
            <label>Category</label>
            <input value={current.change_category || '—'} readOnly />
          </div>
          <div className="field">
            <label>Effective Date</label>
            <input
              value={
                current.effective_date
                  ? new Date(current.effective_date).toLocaleDateString('id-ID')
                  : '—'
              }
              readOnly
            />
          </div>
        </div>

        <div className="field">
          <label>Reason</label>
          <textarea rows={2} value={current.reason || '—'} readOnly />
        </div>
        <div className="field">
          <label>Summary of Changes</label>
          <textarea rows={2} value={current.summary || '—'} readOnly />
        </div>

        {actions.length > 0 && (
          <div className="field">
            <label>Status actions (Legal-managed · no approval workflow)</label>
            <div className="row-actions" style={{ flexWrap: 'wrap', gap: 8 }}>
              {actions.map((a) => (
                <button
                  key={a.action}
                  type="button"
                  className={`btn ${a.action === 'mark_fully_signed' ? 'brass' : 'ghost'} small`}
                  disabled={busy}
                  onClick={() => void runStatus(a.action)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {current.status === 'fully_signed' && (
          <p className="muted" style={{ fontSize: 12 }}>
            Fully Signed — current summary parent sudah di-update; dokumen kontrak asli tidak
            di-overwrite.
          </p>
        )}

        {error && <p className="error-text">{error}</p>}

        <div className="modal-foot">
          <button type="button" className="btn ghost" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
