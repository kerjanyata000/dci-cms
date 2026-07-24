'use client'

import { ModalCloseButton } from '@/components/ui/icons'
import { useState } from 'react'
import { uploadSupportingDocument } from '@/lib/contracts/api'
import type { Contract, DocumentRow } from '@/types/cms'

type Props = {
  partyId: string
  contracts: Contract[]
  open: boolean
  onClose: () => void
  onUploaded: (doc: DocumentRow) => void
}

export function UploadSupportingModal({ partyId, contracts, open, onClose, onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [contractId, setContractId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const doc = await uploadSupportingDocument(partyId, {
        file,
        description: description.trim() || undefined,
        contract_id: contractId || undefined,
      })
      onUploaded(doc)
      setFile(null)
      setDescription('')
      setContractId('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload gagal')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <div>
            <h2>Upload Supporting Document</h2>
            <p className="muted">FR-CNT-SUP-001/004 — tidak mengubah lifecycle kontrak</p>
          </div>
          <ModalCloseButton onClick={onClose} />
        </div>

        <div className="field">
          <label htmlFor="sup-file">File (PDF/DOCX, max 20MB) *</label>
          <input
            id="sup-file"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="sup-contract">Link ke Contract (opsional)</label>
          <select id="sup-contract" value={contractId} onChange={(e) => setContractId(e.target.value)}>
            <option value="">Party-level</option>
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.contract_code} — {c.contract_title ?? c.doc_type}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="sup-desc">Description</label>
          <textarea
            id="sup-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="modal-foot">
          <button type="button" className="btn ghost" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="btn primary" disabled={busy || !file}>
            {busy ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </form>
    </div>
  )
}
