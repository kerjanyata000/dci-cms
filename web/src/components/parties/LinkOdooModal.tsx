'use client'

import { useEffect, useState } from 'react'
import { searchPartnersFromApi } from '@/lib/odoo/api'
import { linkPartyOdoo, previewPartyOdooLink } from '@/lib/parties/api'
import { buildOdooComparison } from '@/lib/parties/odoo-link'
import { ODOO_LINK_LABELS } from '@/lib/parties/types'
import type { OdooPartner } from '@/lib/odoo/types'
import type { OdooLinkStatus, Party } from '@/types/cms'

type Props = {
  party: Party
  open: boolean
  onClose: () => void
  onLinked: (party: Party) => void
}

export function LinkOdooModal({ party, open, onClose, onLinked }: Props) {
  const [q, setQ] = useState(party.name)
  const [candidates, setCandidates] = useState<OdooPartner[]>([])
  const [selected, setSelected] = useState<OdooPartner | null>(null)
  const [previewStatus, setPreviewStatus] = useState<OdooLinkStatus | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setQ(party.name)
    setCandidates([])
    setSelected(null)
    setPreviewStatus(null)
    setReason('')
    setError('')
  }, [open, party])

  async function searchOdoo() {
    setBusy(true)
    setError('')
    try {
      const domain = q.trim() ? [['name', 'ilike', `%${q.trim()}%`]] : []
      setCandidates(await searchPartnersFromApi(domain, 10))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search Odoo gagal')
    } finally {
      setBusy(false)
    }
  }

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
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Link gagal')
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  const comparison = selected ? buildOdooComparison(party.name, selected) : []
  const needsReason =
    party.odoo_link_status === 'linked' &&
    party.odoo_partner_id != null &&
    selected != null &&
    party.odoo_partner_id !== selected.id

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div className="modal" role="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2>Link Odoo Partner</h2>
            <p className="muted">
              {party.party_code} · {party.name}
            </p>
          </div>
          <button type="button" className="btn ghost" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="field">
          <label htmlFor="odoo-q">Cari di Odoo (res.partner)</label>
          <div className="row-actions">
            <input id="odoo-q" value={q} onChange={(e) => setQ(e.target.value)} />
            <button type="button" className="btn primary" disabled={busy} onClick={searchOdoo}>
              Search
            </button>
          </div>
        </div>

        {candidates.length > 0 && (
          <div className="card stack" style={{ marginTop: 0 }}>
            <h3>Kandidat Partner</h3>
            <ul className="pick-list">
              {candidates.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`pick-item${selected?.id === p.id ? ' active' : ''}`}
                    onClick={() => pickPartner(p)}
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
            onClick={confirmLink}
          >
            {busy ? 'Menyimpan…' : 'Konfirmasi link'}
          </button>
        </div>
      </div>
    </div>
  )
}
