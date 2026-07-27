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

const PARTY_TYPES = ['Customer', 'Vendor', 'Partner', 'Other']

export function AddPartyModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [pic, setPic] = useState('')
  const [npwp, setNpwp] = useState('')
  const [address, setAddress] = useState('')
  const [partyType, setPartyType] = useState('Customer')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  function reset() {
    setName('')
    setPic('')
    setNpwp('')
    setAddress('')
    setPartyType('Customer')
    setEmail('')
    setPhone('')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    setError('')
    try {
      const party = await createParty({
        name: name.trim(),
        pic: pic.trim() || undefined,
        npwp: npwp.trim() || undefined,
        address: address.trim() || undefined,
        party_type: partyType.trim() || undefined,
        contact_email: email.trim() || undefined,
        contact_phone: phone.trim() || undefined,
      })
      onCreated(party)
      reset()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat party')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <form className="modal modal-wide" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <div>
            <h2>Add New Party</h2>
          </div>
          <ModalCloseButton onClick={onClose} />
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="party-name">Nama Party / Counterparty *</label>
            <input
              id="party-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="PT Contoh Nusantara"
            />
          </div>
          <div className="field">
            <label htmlFor="party-type">Tipe</label>
            <select id="party-type" value={partyType} onChange={(e) => setPartyType(e.target.value)}>
              {PARTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
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
          <div className="field">
            <label htmlFor="party-npwp">NPWP</label>
            <input id="party-npwp" value={npwp} onChange={(e) => setNpwp(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="party-email">Email</label>
            <input
              id="party-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="party-phone">Telepon</label>
            <input id="party-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="party-address">Alamat</label>
          <textarea
            id="party-address"
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
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
