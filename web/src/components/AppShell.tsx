'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { GlobalSearch } from '@/components/shell/GlobalSearch'
import { NotificationsBell } from '@/components/shell/NotificationsBell'
import { ROLES, type SessionUser } from '@/lib/roles'
import { ODOO_MODE } from '@/lib/odoo/client'
import { RAGFLOW_MODE } from '@/lib/ragflow/client'
import './shell.css'

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  parties: 'Parties',
  search: 'Smart Search',
  renewal: 'Renewal Calendar',
  so: 'SO Health',
}

type Props = {
  user: SessionUser
  onLogout: () => void
  children: React.ReactNode
}

export function AppShell({ user, onLogout, children }: Props) {
  const pathname = usePathname()
  const role = ROLES[user.role]
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!drawerOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  const navLinks = (
    <>
      {role.nav.map((view) => {
        const href = `/${view}`
        const active = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={view}
            href={href}
            className={`nav-item${active ? ' active' : ''}`}
            onClick={() => setDrawerOpen(false)}
          >
            {LABELS[view] ?? view}
          </Link>
        )
      })}
      <Link
        href="/lab/extraction"
        className={`nav-item${pathname.startsWith('/lab/extraction') ? ' active' : ''}`}
        onClick={() => setDrawerOpen(false)}
      >
        Extraction Lab
      </Link>
    </>
  )

  return (
    <div className={`shell${drawerOpen ? ' drawer-open' : ''}`}>
      {drawerOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Tutup menu"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <aside className="sidebar" aria-hidden={!drawerOpen && undefined}>
        <div className="brand">
          <div className="brand-seal">CM</div>
          <div className="brand-text">
            <b>Contract MS</b>
            <span>Party-Centric · Odoo</span>
          </div>
        </div>
        <nav className="nav-group">{navLinks}</nav>
        <div className="sidebar-foot">
          {user.name}
          <br />
          <span className="role-badge">{role.label}</span>
          {role.views.includes('audit') && (
            <>
              <br />
              <Link href="/activity" className="sidebar-link" onClick={() => setDrawerOpen(false)}>
                Activity Log
              </Link>
            </>
          )}
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button
            type="button"
            className="btn ghost menu-toggle"
            aria-label="Buka menu navigasi"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((v) => !v)}
          >
            ☰
          </button>
          <GlobalSearch />
          <div className="topbar-modes">
            Odoo: {ODOO_MODE.toUpperCase()} · RAGFlow: {RAGFLOW_MODE.toUpperCase()}
          </div>
          <div className="top-right">
            {role.views.includes('notifications') && <NotificationsBell />}
            <span className="user-chip">
              <span className="user-avatar">{role.initials}</span>
              <span>
                <b>{user.name}</b>
                <span className="muted">{role.label}</span>
              </span>
            </span>
            <button type="button" className="btn ghost" onClick={onLogout}>
              Keluar
            </button>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  )
}
