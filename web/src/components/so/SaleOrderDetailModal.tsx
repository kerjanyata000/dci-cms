'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ModalCloseButton } from '@/components/ui/icons'
import { formatCurrency } from '@/lib/format/currency'
import { fetchSaleOrderDetail, type SaleOrderDetail } from '@/lib/so/api'

type Props = {
  orderId: string | null
  open: boolean
  onClose: () => void
}

const STAGES = [
  { key: 'draft', label: 'Quotation' },
  { key: 'sent', label: 'Quotation Sent' },
  { key: 'sale', label: 'Sales Order' },
] as const

function stageIndex(state: string): number {
  if (state === 'done') return 3
  if (state === 'sale') return 2
  if (state === 'sent') return 1
  if (state === 'cancel') return -1
  return 0
}

function formatWhen(value: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function SaleOrderDetailModal({ orderId, open, onClose }: Props) {
  const [detail, setDetail] = useState<SaleOrderDetail | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !orderId) {
      setDetail(null)
      setError('')
      return
    }
    let cancelled = false
    setBusy(true)
    setError('')
    void (async () => {
      try {
        const data = await fetchSaleOrderDetail(orderId)
        if (!cancelled) setDetail(data)
      } catch (err) {
        if (!cancelled) {
          setDetail(null)
          setError(err instanceof Error ? err.message : 'Gagal memuat detail SO')
        }
      } finally {
        if (!cancelled) setBusy(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, orderId])

  if (!open) return null

  const active = detail ? stageIndex(detail.state) : 0

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal modal-so-detail"
        role="dialog"
        aria-labelledby="so-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p className="muted" style={{ margin: 0 }}>
              {detail?.documentLabel ?? 'Sales Order'} · view-only
            </p>
            <h2 id="so-detail-title">{detail?.name ?? (busy ? 'Memuat…' : 'Detail SO')}</h2>
          </div>
          <ModalCloseButton onClick={onClose} />
        </div>

        {error && <p className="error-text">{error}</p>}
        {busy && !detail && <p className="muted">Mengambil data dari Odoo / mirror…</p>}

        {detail && (
          <>
            <div className="so-stage-bar" aria-label="Status dokumen">
              {STAGES.map((s, i) => (
                <span
                  key={s.key}
                  className={`so-stage${
                    detail.state === 'cancel'
                      ? ''
                      : i < active
                        ? ' done'
                        : i === active
                          ? ' current'
                          : ''
                  }${detail.state === 'done' && i === STAGES.length - 1 ? ' done current' : ''}`}
                >
                  {s.label}
                </span>
              ))}
              {detail.state === 'done' && <span className="so-stage done current">Locked</span>}
              {detail.state === 'cancel' && <span className="so-stage cancel current">Cancelled</span>}
            </div>

            <div className="notice notice-warn" style={{ marginTop: 12 }}>
              <div className="notice-body">
                Referensi dari Odoo — CMS tidak membuat invoice / ubah SO. Kelola dokumen di Odoo.
                {detail.source === 'mirror' ? ' (tampil dari mirror; detail baris disederhanakan)' : ''}
              </div>
            </div>

            <div className="so-detail-grid">
              <div className="so-detail-customer">
                <span className="info-label">Customer</span>
                <b>{detail.customer.name}</b>
                {detail.customer.addressLines.map((line) => (
                  <div key={line} className="muted">
                    {line}
                  </div>
                ))}
                {detail.customer.vat && (
                  <div className="muted">
                    Tax ID: <span className="mono">{detail.customer.vat}</span>
                  </div>
                )}
                {detail.customer.email && <div className="muted">{detail.customer.email}</div>}
                {detail.party && (
                  <div style={{ marginTop: 8 }}>
                    <Link href={`/parties/${detail.party.id}`} className="link-tag">
                      Party CMS {detail.party.party_code} →
                    </Link>
                  </div>
                )}
              </div>

              <div className="so-detail-meta">
                <div className="info-pair">
                  <span className="info-label">Order Date</span>
                  <span>{formatWhen(detail.dateOrder)}</span>
                </div>
                <div className="info-pair">
                  <span className="info-label">Payment Terms</span>
                  <span>{detail.paymentTerm ?? '—'}</span>
                </div>
                <div className="info-pair">
                  <span className="info-label">Delivery Date</span>
                  <span>{formatWhen(detail.commitmentDate)}</span>
                </div>
                <div className="info-pair">
                  <span className="info-label">Customer Reference</span>
                  <span>{detail.clientOrderRef ?? '—'}</span>
                </div>
                <div className="info-pair">
                  <span className="info-label">Odoo State</span>
                  <span className="mono">{detail.state}</span>
                </div>
                <div className="info-pair">
                  <span className="info-label">Last Synced</span>
                  <span className="mono">{formatWhen(detail.syncedAt)}</span>
                </div>
              </div>
            </div>

            <div className="so-lines-head">
              <h3>Order Lines</h3>
            </div>
            <div className="table-wrap">
              <table className="data-table so-lines-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Delivered</th>
                    <th>Invoiced</th>
                    <th>Unit Price</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.lines.map((line) => (
                    <tr key={String(line.id)}>
                      <td>
                        <div>{line.product}</div>
                        {line.description !== line.product && (
                          <div className="muted" style={{ fontSize: 12 }}>
                            {line.description}
                          </div>
                        )}
                      </td>
                      <td className="mono">{line.qty.toLocaleString('id-ID')}</td>
                      <td className="mono">{line.qtyDelivered.toLocaleString('id-ID')}</td>
                      <td className="mono">{line.qtyInvoiced.toLocaleString('id-ID')}</td>
                      <td className="mono">{formatCurrency(line.unitPrice)}</td>
                      <td className="mono">{formatCurrency(line.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="so-totals">
              <div className="so-total-row">
                <span>Untaxed Amount</span>
                <b className="mono">{formatCurrency(detail.amountUntaxed)}</b>
              </div>
              <div className="so-total-row">
                <span>Taxes</span>
                <b className="mono">{formatCurrency(detail.amountTax)}</b>
              </div>
              <div className="so-total-row so-total-grand">
                <span>Total</span>
                <b className="mono">{formatCurrency(detail.amountTotal)}</b>
              </div>
            </div>
          </>
        )}

        <div className="modal-foot">
          <button type="button" className="btn ghost" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
