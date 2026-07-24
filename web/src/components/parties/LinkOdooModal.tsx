'use client'

import { ModalCloseButton } from '@/components/ui/icons'
import { useCallback, useEffect, useState } from 'react'
import { searchPartnersFromApi } from '@/lib/odoo/api'
import { linkPartyOdoo, previewPartyOdooLink } from '@/lib/parties/api'
import { buildOdooComparison } from '@/lib/parties/odoo-link'
import { ODOO_LINK_HINTS, ODOO_LINK_LABELS } from '@/lib/parties/types'
import type { OdooPartner } from '@/lib/odoo/types'
import type { OdooLinkStatus, Party } from '@/types/cms'

type Props = {
  party: Party
  open: boolean
  onClose: () => void
  onLinked: (party: Party) => void
}

type SuccessState = {
  party: Party
  partnerName: string
  partnerId: number
  status: OdooLinkStatus
}

export function LinkOdooModal({ party, open, onClose, onLinked }: Props) {
  const [q, setQ] = useState(party.name)
  const [candidates, setCandidates] = useState<OdooPartner[]>([])
  const [selected, setSelected] = useState<OdooPartner | null>(null)
  const [previewStatus, setPreviewStatus] = useState<OdooLinkStatus | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<SuccessState | null>(null)

  const runSearch = useCallback(async (query: string) => {
    setBusy(true)
    setError('')
    try {
      const domain = query.trim() ? [['name', 'ilike', `%${query.trim()}%`]] : []
      setCandidates(await searchPartnersFromApi(domain, 10))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search Odoo gagal')
      setCandidates([])
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setQ(party.name)
    setCandidates([])
    setSelected(null)
    setPreviewStatus(null)
    setReason('')
    setError('')
    setSuccess(null)
    void runSearch(party.name)
  }, [open, party, runSearch])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  async function pickPartner(partner: OdooPartner) {
    setSelected(partner)
    setError('')
    try {
      const preview = await previewPartyOdooLink(party.id, partner.id)
      setPreviewStatus(preview.suggestedStatus)
    } catch (err) {
      setPreviewStatus(null)
      setError(err instanceof Error ? err.message : 'Preview gagal')
    }
  }

  async function confirmLink() {
    if (!selected) return
    setBusy(true)
    setError('')
    try {
      const updated = await linkPartyOdoo(party.id, {
        odooPartnerId: selected.id,
        reason: reason.trim() || undefined,
      })
      onLinked(updated)
      setSuccess({
        party: updated,
        partnerName: selected.name,
        partnerId: selected.id,
        status: updated.odoo_link_status,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Link gagal')
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  const hasExistingLink = party.odoo_partner_id != null
  const comparison = selected ? buildOdooComparison(party.name, selected) : []
  const needsReason =
    party.odoo_link_status === 'linked' &&
    party.odoo_partner_id != null &&
    selected != null &&
    party.odoo_partner_id !== selected.id

  if (success) {
    return (
      <div className="modal-overlay" role="presentation">
        <div className="modal" role="dialog" aria-labelledby="link-success-title">
          <div className="modal-head">
            <div>
              <h2 id="link-success-title">Link Odoo berhasil</h2>
              <p className="muted">{party.party_code}</p>
            </div>
          </div>

          <div className="link-success-box">
            <p>
              <b>{party.name}</b> → Odoo Partner
            </p>
            <p className="mono link-success-partner">
              #{success.partnerId} · {success.partnerName}
            </p>
            <p style={{ marginTop: 12 }}>
              Status:{' '}
              <span className={`pill pill-${success.status}`}>
                {ODOO_LINK_LABELS[success.status]}
              </span>
            </p>
            <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
              {ODOO_LINK_HINTS[success.status]}
            </p>
            {success.status === 'mismatch' && (
              <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                Lihat kolom <b>Odoo Link</b> di tabel Parties atau banner di Party Detail.
              </p>
            )}
          </div>

          <div className="modal-foot">
            <button type="button" className="btn primary" onClick={onClose}>
              Tutup
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" role="presentation">
      <div className="modal modal-wide" role="dialog" aria-labelledby="link-odoo-title">
        <div className="modal-head">
          <div>
            <h2 id="link-odoo-title">Link Odoo Partner</h2>
            <p className="muted">
              {party.party_code} · {party.name}
            </p>
          </div>
          <ModalCloseButton onClick={onClose} />
        </div>

        {hasExistingLink && (
          <div className={`link-current-banner link-current-${party.odoo_link_status}`}>
            <div>
              <b>Link saat ini</b>
              <p className="mono">
                res.partner #{party.odoo_partner_id} ·{' '}
                <span className={`pill pill-${party.odoo_link_status}`}>
                  {ODOO_LINK_LABELS[party.odoo_link_status]}
                </span>
              </p>
              <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                {ODOO_LINK_HINTS[party.odoo_link_status]}
              </p>
            </div>
          </div>
        )}

        {!hasExistingLink && (
          <p className="muted modal-hint">
            Kandidat Partner di bawah sudah dicari otomatis. Modal hanya tertutup lewat Batal atau tombol tutup.
            (klik area gelap tidak menutup).
          </p>
        )}

        <div className="field">
          <label htmlFor="odoo-q">Cari di Odoo (res.partner)</label>
          <div className="row-actions">
            <input
              id="odoo-q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void runSearch(q)
                }
              }}
            />
            <button type="button" className="btn primary" disabled={busy} onClick={() => void runSearch(q)}>
              {busy ? '…' : 'Search'}
            </button>
          </div>
        </div>

        {candidates.length > 0 && (
          <div className="card stack" style={{ marginTop: 0 }}>
            <h3>Kandidat Partner ({candidates.length})</h3>
            <ul className="pick-list">
              {candidates.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`pick-item${selected?.id === p.id ? ' active' : ''}`}
                    onClick={() => void pickPartner(p)}
                  >
                    <span className="mono">#{p.id}</span> {p.name}
                    <span className="muted">
                      VAT {String(p.vat || '—')} · ref {String(p.ref || '—')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!busy && candidates.length === 0 && !error && (
          <p className="muted">Tidak ada kandidat — ubah kata kunci lalu Search.</p>
        )}

        {selected && (
          <div className="card stack" style={{ marginTop: 0 }}>
            <h3>Perbandingan sebelum link</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>CMS Party</th>
                  <th>Odoo Partner</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.field}>
                    <td>{row.field}</td>
                    <td>{row.cms}</td>
                    <td>{row.odoo}</td>
                    <td>{row.match ? '✓' : '≠'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewStatus && (
              <p>
                Status usulan:{' '}
                <span className={`pill pill-${previewStatus}`}>
                  {ODOO_LINK_LABELS[previewStatus]}
                </span>
                <span className="muted" style={{ marginLeft: 8, fontSize: 12 }}>
                  {ODOO_LINK_HINTS[previewStatus]}
                </span>
              </p>
            )}
          </div>
        )}

        {needsReason && (
          <div className="field">
            <label htmlFor="relink-reason">Alasan relink (wajib)</label>
            <textarea
              id="relink-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Alasan perubahan link Partner Odoo…"
            />
          </div>
        )}

        {error && <p className="error-text">{error}</p>}

        <div className="modal-foot">
          <button type="button" className="btn ghost" onClick={onClose}>
            Batal
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={!selected || busy || (needsReason && !reason.trim())}
            onClick={() => void confirmLink()}
          >
            {busy ? 'Menyimpan…' : hasExistingLink ? 'Update link' : 'Konfirmasi link'}
          </button>
        </div>
      </div>
    </div>
  )
}
