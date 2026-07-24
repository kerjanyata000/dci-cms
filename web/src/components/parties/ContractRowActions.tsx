'use client'

import { useEffect, useRef, useState } from 'react'
import type { Contract } from '@/types/cms'
import { ACTIVE_FOR_TERM } from '@/lib/contracts/constants'

type Props = {
  contract: Contract
  onReview: () => void
  onEdit: () => void
  onAmendment: () => void
  onTermination: () => void
  onCpChange: () => void
}

export function ContractRowActions({
  contract,
  onReview,
  onEdit,
  onAmendment,
  onTermination,
  onCpChange,
}: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const canTerm = ACTIVE_FOR_TERM.includes(contract.status)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  function pick(action: () => void) {
    action()
    setOpen(false)
  }

  return (
    <div className="contract-row-actions" ref={ref}>
      <button type="button" className="btn ghost small" onClick={onReview}>
        Review
      </button>
      <button
        type="button"
        className="btn ghost small contract-more-btn"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Aksi kontrak lainnya"
        onClick={() => setOpen((v) => !v)}
      >
        Lainnya ▾
      </button>
      {open && (
        <div className="contract-actions-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => pick(onEdit)}>
            Edit Details
          </button>
          <button type="button" role="menuitem" onClick={() => pick(onAmendment)}>
            Amendment
          </button>
          {canTerm && (
            <button type="button" role="menuitem" onClick={() => pick(onTermination)}>
              Early Termination
            </button>
          )}
          <button type="button" role="menuitem" onClick={() => pick(onCpChange)}>
            Change Counterparty
          </button>
        </div>
      )}
    </div>
  )
}
