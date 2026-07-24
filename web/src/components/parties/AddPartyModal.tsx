'use client'

import { useState } from 'react'
import { ModalCloseButton } from '@/components/ui/icons'
import { createParty } from '@/lib/parties/api'
import type { Party } from '@/types/cms'

type Props = {
  open: boolean
  onClose: () => void
  onCreated: (party: Party) => void
}

export function AddPartyModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [pic, setPic] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    setError('')
    try {
      const party = await createParty({ name: name.trim(), pic: pic.trim() || undefined })
      onCreated(party)
      setName('')
      setPic('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat party')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <div>
            <h2>Add New Party</h2>
            <p className="muted">Disimpan ke Supabase · status awal Pending Odoo Link</p>
          </div>
          <ModalCloseButton onClick={onClose} />
        </div>

        <div className="field">
          <label htmlFor="party-name">Nama Party / Counterparty</label>
          <input
            id="party-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="PT Contoh Nusantara"
          />
        </div>
        <div className="field">
          <label htmlFor="party-pic">PIC</label>
          <input
            id="party-pic"
            value={pic}
            onChange={(e) => setPic(e.target.value)}
            placeholder="Nama PIC"
          />
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="modal-foot">
          <button type="button" className="btn ghost" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="btn primary" disabled={busy || !name.trim()}>
            {busy ? 'Menyimpan…' : 'Simpan Party'}
          </button>
        </div>
      </form>
    </div>
  )
}
