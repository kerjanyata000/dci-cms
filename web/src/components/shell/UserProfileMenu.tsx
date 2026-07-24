'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ROLES, type SessionUser } from '@/lib/roles'

type Props = {
  user: SessionUser
  onLogout: () => void
  onNavigate?: () => void
}

export function UserProfileMenu({ user, onLogout, onNavigate }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const role = ROLES[user.role]

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  function closeAndNavigate() {
    setOpen(false)
    onNavigate?.()
  }

  return (
    <div className="profile-wrap" ref={ref}>
      <button
        type="button"
        className="user-chip profile-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="user-avatar">{role.initials}</span>
        <span className="profile-trigger-text">
          <b>{user.name}</b>
          <span className="muted">{role.label}</span>
        </span>
      </button>
      {open && (
        <div className="profile-panel" role="menu">
          <div className="profile-panel-head">
            <b>{user.name}</b>
            <span className="role-badge">{role.label}</span>
          </div>
          <nav className="profile-panel-nav">
            {role.nav.includes('so') && (
              <Link href="/so" role="menuitem" onClick={closeAndNavigate}>
                SO Health
              </Link>
            )}
            {role.views.includes('audit') && (
              <Link href="/activity" role="menuitem" onClick={closeAndNavigate}>
                Activity Log
              </Link>
            )}
            {(user.role === 'legal' || user.role === 'it') && (
              <Link href="/lab/extraction" role="menuitem" onClick={closeAndNavigate}>
                Extraction Lab
              </Link>
            )}
            {role.views.includes('notifications') && (
              <Link href="/notifications" role="menuitem" onClick={closeAndNavigate}>
                Notifikasi
              </Link>
            )}
          </nav>
          <button
            type="button"
            className="btn ghost profile-logout"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
          >
            Keluar
          </button>
        </div>
      )}
    </div>
  )
}
