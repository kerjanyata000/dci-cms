'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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

type MenuPos = { top: number; left: number; openUp: boolean }

export function ContractRowActions({
  contract,
  onReview,
  onEdit,
  onAmendment,
  onTermination,
  onCpChange,
}: Props) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<MenuPos | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const canTerm = ACTIVE_FOR_TERM.includes(contract.status)

  useLayoutEffect(() => {
    if (!open || !btnRef.current) {
      setPos(null)
      return
    }

    function place() {
      const btn = btnRef.current
      const menu = menuRef.current
      if (!btn) return
      const rect = btn.getBoundingClientRect()
      const menuH = menu?.offsetHeight ?? 180
      const menuW = menu?.offsetWidth ?? 200
      const gap = 4
      const spaceBelow = window.innerHeight - rect.bottom
      const openUp = spaceBelow < menuH + gap && rect.top > spaceBelow
      const top = openUp ? rect.top - menuH - gap : rect.bottom + gap
      let left = rect.right - menuW
      left = Math.max(8, Math.min(left, window.innerWidth - menuW - 8))
      setPos({ top, left, openUp })
    }

    place()
    // Re-measure after paint once menu has real height
    const raf = requestAnimationFrame(place)
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open, canTerm])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (wrapRef.current?.contains(t)) return
      if (menuRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function pick(action: () => void) {
    action()
    setOpen(false)
  }

  const menu =
    open &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        ref={menuRef}
        className={`contract-actions-menu contract-actions-menu-floating${pos?.openUp ? ' open-up' : ''}`}
        role="menu"
        style={
          pos
            ? { top: pos.top, left: pos.left }
            : { top: -9999, left: -9999, visibility: 'hidden' }
        }
      >
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
      </div>,
      document.body,
    )

  return (
    <div className="contract-row-actions" ref={wrapRef}>
      <button type="button" className="btn ghost small" onClick={onReview}>
        Review
      </button>
      <button
        ref={btnRef}
        type="button"
        className="btn ghost small contract-more-btn"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Aksi kontrak lainnya"
        onClick={() => setOpen((v) => !v)}
      >
        Lainnya ▾
      </button>
      {menu}
    </div>
  )
}
