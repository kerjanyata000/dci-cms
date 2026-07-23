'use client'

import { useEffect, useState } from 'react'
import type { Contract, ContractMetadata } from '@/types/cms'
import { confirmContractMetadata, transitionContractStatus } from '@/lib/contracts/api'
import { uploadSignedContractDocument } from '@/lib/documents/api'

const META_FIELDS: Array<{ key: keyof ContractMetadata; label: string }> = [
  { key: 'counterpartyName', label: 'Counterparty' },
  { key: 'agreementNo', label: 'Agreement No' },
  { key: 'contractPeriod', label: 'Period' },
  { key: 'contractValue', label: 'Value' },
  { key: 'npwp', label: 'NPWP' },
  { key: 'address', label: 'Address' },
  { key: 'signer', label: 'Signer' },
]

const STATUS_ACTIONS: Array<{
  action: string
  label: string
  showWhen: string[]
}> = [
  { action: 'submit_review', label: 'Submit Review', showWhen: ['draft'] },
  { action: 'send_to_cp', label: 'Sent to CP', showWhen: ['under_review'] },
  { action: 'ready_for_sign', label: 'Ready for Sign', showWhen: ['sent'] },
  { action: 'mark_fully_signed', label: 'Mark Fully Signed', showWhen: ['ready_for_sign', 'sent'] },
  { action: 'mark_active', label: 'Mark Active', showWhen: ['ready_for_sign', 'sent', 'fully_signed'] },
  { action: 'back_to_draft', label: 'Back to Draft', showWhen: ['under_review', 'sent'] },
]

type Props = {
  contract: Contract
  open: boolean
  onClose: () => void
  onUpdated: (contract: Contract) => void
}

export function ContractReviewModal({ contract, open, onClose, onUpdated }: Props) {
  const [confirmed, setConfirmed] = useState<ContractMetadata>(contract.confirmed_metadata ?? {})
  const [signedFile, setSignedFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setConfirmed(contract.confirmed_metadata ?? {})
      setError('')
    }
  }, [open, contract])

  if (!open) return null

  async function saveMetadata() {
    setBusy(true)
    setError('')
    try {
      onUpdated(await confirmContractMetadata(contract.id, confirmed))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal simpan metadata')
    } finally {
      setBusy(false)
    }
  }

  async function runStatus(action: string) {
    setBusy(true)
    setError('')
    try {
      onUpdated(await transitionContractStatus(contract.id, action))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status gagal')
    } finally {
      setBusy(false)
    }
  }

  async function uploadSigned() {
    if (!signedFile) return
    setBusy(true)
    setError('')
    try {
      const result = await uploadSignedContractDocument(contract.id, signedFile, true)
      onUpdated(result.contract as Contract)
      setSignedFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload signed doc gagal')
    } finally {
      setBusy(false)
    }
  }

  const extracted = contract.extracted_metadata ?? {}
  const canUploadSigned = ['ready_for_sign', 'sent', 'fully_signed'].includes(contract.status)

  return (
    <div className="modal-overlay" role="presentation">
      <div className="modal modal-wide" role="dialog">
        <div className="modal-head">
          <div>
            <h2>Review Contract</h2>
            <p className="muted">
              FR-CNT-ADD-004/005 · {contract.contract_code} · {contract.status_text}
            </p>
          </div>
          <button type="button" className="btn ghost" onClick={onClose}>
            ✕
          </button>
        </div>

        <p className="ref-tag">
          Dual metadata · validation: {contract.validation_status}
          {contract.original_party_id && contract.original_party_id !== contract.party_id && (
            <span> · original party #{contract.original_party_id.slice(0, 8)}…</span>
          )}
        </p>

        <table className="data-table meta-compare-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Extracted (RAGFlow)</th>
              <th>Confirmed (user)</th>
            </tr>
          </thead>
          <tbody>
            {META_FIELDS.map(({ key, label }) => {
              const ex = extracted[key] ?? ''
              const cf = confirmed[key] ?? ''
              const mismatch = ex && cf && ex.toLowerCase() !== cf.toLowerCase()
              return (
                <tr key={key} className={mismatch ? 'meta-mismatch' : ''}>
                  <td>{label}</td>
                  <td className="muted">{ex || '—'}</td>
                  <td>
                    <input
                      value={cf}
                      onChange={(e) =>
                        setConfirmed((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {contract.validation_notes && (
          <p className="muted" style={{ fontSize: 12 }}>
            Notes: {contract.validation_notes}
          </p>
        )}

        <div className="row-actions" style={{ marginTop: 12, flexWrap: 'wrap' }}>
          {STATUS_ACTIONS.filter((a) => a.showWhen.includes(contract.status)).map((a) => (
            <button
              key={a.action}
              type="button"
              className="btn ghost"
              disabled={busy}
              onClick={() => void runStatus(a.action)}
            >
              {a.label}
            </button>
          ))}
        </div>

        {canUploadSigned && (
          <div className="card stack" style={{ marginTop: 12, padding: 12, background: 'var(--paper)' }}>
            <p className="ref-tag" style={{ margin: 0 }}>
              BRL-CMS-018 · Upload signed PDF → Supabase Storage (tidak re-index RAGFlow)
            </p>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="signed-file">Signed document</label>
              <input
                id="signed-file"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf"
                onChange={(e) => setSignedFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <button
              type="button"
              className="btn primary"
              disabled={busy || !signedFile}
              onClick={() => void uploadSigned()}
            >
              Upload &amp; Mark Fully Signed
            </button>
          </div>
        )}

        {error && <p className="error-text">{error}</p>}

        <div className="modal-foot">
          <button type="button" className="btn ghost" onClick={onClose}>
            Tutup
          </button>
          <button type="button" className="btn primary" disabled={busy} onClick={() => void saveMetadata()}>
            {busy ? 'Menyimpan…' : 'Konfirmasi Metadata'}
          </button>
        </div>
      </div>
    </div>
  )
}
