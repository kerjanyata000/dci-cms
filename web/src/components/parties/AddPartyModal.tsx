'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ModalCloseButton } from '@/components/ui/icons'
import { checkPartyDuplicates, createParty, type PartyDuplicateMatch } from '@/lib/parties/api'
import type { Party } from '@/types/cms'

type Props = {
  open: boolean
  onClose: () => void
  onCreated: (party: Party) => void
}

const PARTY_TYPES = ['Customer', 'Vendor', 'Partner', 'Other']

function matchLabel(match: PartyDuplicateMatch['match']) {
  if (match === 'both') return 'nama & NPWP'
  if (match === 'npwp') return 'NPWP'
  return 'nama'
}

export function AddPartyModal({ open, onClose, onCreated }: Props) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [pic, setPic] = useState('')
  const [npwp, setNpwp] = useState('')
  const [address, setAddress] = useState('')
  const [partyType, setPartyType] = useState('Customer')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [duplicates, setDuplicates] = useState<PartyDuplicateMatch[]>([])
  const [checkingDup, setCheckingDup] = useState(false)

  useEffect(() => {
    if (!open) return
    const nameTrim = name.trim()
    const npwpTrim = npwp.trim()
    if (!nameTrim && !npwpTrim) {
      setDuplicates([])
      return
    }

    const timer = window.setTimeout(() => {
      void (async () => {
        setCheckingDup(true)
        try {
          setDuplicates(await checkPartyDuplicates({ name: nameTrim, npwp: npwpTrim }))
        } catch {
          setDuplicates([])
        } finally {
          setCheckingDup(false)
        }
      })()
    }, 350)

    return () => window.clearTimeout(timer)
  }, [open, name, npwp])

  if (!open) return null

  const hasDuplicate = duplicates.length > 0

  function reset() {
    setName('')
    setPic('')
    setNpwp('')
    setAddress('')
    setPartyType('Customer')
    setEmail('')
    setPhone('')
    setDuplicates([])
    setError('')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || hasDuplicate) return
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

  function openExisting(partyId: string) {
    onClose()
    router.push(`/parties/${partyId}`)
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
              aria-invalid={hasDuplicate}
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
            <input
              id="party-npwp"
              value={npwp}
              onChange={(e) => setNpwp(e.target.value)}
              aria-invalid={hasDuplicate}
            />
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

        {checkingDup && <p className="muted">Memeriksa duplikat…</p>}

        {hasDuplicate && (
          <div className="notice notice-warn" role="alert">
            <div className="notice-body">
              <b>Tidak bisa disimpan — party sudah ada</b>
              <p className="muted" style={{ margin: '0.35rem 0 0' }}>
                Bentrok {matchLabel(duplicates[0].match)}. Buka party yang ada, jangan buat ulang.
              </p>
              <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem' }}>
                {duplicates.slice(0, 5).map((d) => (
                  <li key={d.party.id}>
                    <button
                      type="button"
                      className="btn ghost"
                      style={{ padding: '0.15rem 0.4rem', marginRight: '0.35rem' }}
                      onClick={() => openExisting(d.party.id)}
                    >
                      {d.party.party_code}
                    </button>
                    {d.party.name}
                    {d.party.party_status === 'Inactive' ? ' (Inactive)' : ''}
                    <span className="muted"> · match: {matchLabel(d.match)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {error && <p className="error-text">{error}</p>}

        <div className="modal-foot">
          <button type="button" className="btn ghost" onClick={onClose}>
            Batal
          </button>
          <button
            type="submit"
            className="btn primary"
            disabled={busy || !name.trim() || hasDuplicate || checkingDup}
          >
            {busy ? 'Menyimpan…' : 'Simpan Party'}
          </button>
        </div>
      </form>
    </div>
  )
}
