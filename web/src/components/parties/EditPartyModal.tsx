'use client'

import { useEffect, useState } from 'react'
import { ModalCloseButton } from '@/components/ui/icons'
import { updateParty, setPartyActive } from '@/lib/parties/api'
import type { Party } from '@/types/cms'

type Props = {
  party: Party
  open: boolean
  onClose: () => void
  onUpdated: (party: Party) => void
}

const PARTY_TYPES = ['Customer', 'Vendor', 'Partner', 'Other']

export function EditPartyModal({ party, open, onClose, onUpdated }: Props) {
  const [name, setName] = useState(party.name)
  const [pic, setPic] = useState(party.pic ?? '')
  const [npwp, setNpwp] = useState(party.npwp ?? '')
  const [address, setAddress] = useState(party.address ?? '')
  const [partyType, setPartyType] = useState(party.party_type ?? 'Customer')
  const [email, setEmail] = useState(party.contact_email ?? '')
  const [phone, setPhone] = useState(party.contact_phone ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setName(party.name)
    setPic(party.pic ?? '')
    setNpwp(party.npwp ?? '')
    setAddress(party.address ?? '')
    setPartyType(party.party_type ?? 'Customer')
    setEmail(party.contact_email ?? '')
    setPhone(party.contact_phone ?? '')
    setError('')
  }, [open, party])

  if (!open) return null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    setError('')
    try {
      onUpdated(
        await updateParty(party.id, {
          name: name.trim(),
          pic: pic.trim() || null,
          npwp: npwp.trim() || null,
          address: address.trim() || null,
          party_type: partyType.trim() || null,
          contact_email: email.trim() || null,
          contact_phone: phone.trim() || null,
        }),
      )
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan party')
    } finally {
      setBusy(false)
    }
  }

  async function toggleActive() {
    const next = party.party_status === 'Inactive' ? 'Active' : 'Inactive'
    if (
      next === 'Inactive' &&
      !window.confirm(`Nonaktifkan ${party.name}? Party Inactive tidak bisa dipakai kontrak baru.`)
    ) {
      return
    }
    setBusy(true)
    setError('')
    try {
      onUpdated(await setPartyActive(party.id, next === 'Active'))
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal ubah status party')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <form className="modal modal-wide" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <div>
            <h2>Edit Party</h2>
            <p className="muted">
              {party.party_code} · {party.party_status}
            </p>
          </div>
          <ModalCloseButton onClick={onClose} />
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="ep-name">Nama Party *</label>
            <input
              id="ep-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="ep-type">Tipe</label>
            <select id="ep-type" value={partyType} onChange={(e) => setPartyType(e.target.value)}>
              {PARTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="ep-pic">PIC</label>
            <input id="ep-pic" value={pic} onChange={(e) => setPic(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="ep-npwp">NPWP</label>
            <input id="ep-npwp" value={npwp} onChange={(e) => setNpwp(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="ep-email">Email</label>
            <input
              id="ep-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="ep-phone">Telepon</label>
            <input id="ep-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="ep-address">Alamat</label>
          <textarea
            id="ep-address"
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="modal-foot" style={{ justifyContent: 'space-between' }}>
          <button type="button" className="btn ghost" disabled={busy} onClick={() => void toggleActive()}>
            {party.party_status === 'Inactive' ? 'Aktifkan Party' : 'Nonaktifkan Party'}
          </button>
          <div className="row-actions">
            <button type="button" className="btn ghost" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn primary" disabled={busy || !name.trim()}>
              {busy ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
