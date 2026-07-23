'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GlobalSearch } from '@/components/shell/GlobalSearch'
import { NotificationsBell } from '@/components/shell/NotificationsBell'
import { ROLES, type SessionUser } from '@/lib/roles'
import { ODOO_MODE } from '@/lib/odoo/client'
import { RAGFLOW_MODE } from '@/lib/ragflow/client'
import './shell.css'

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  parties: 'Parties',
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

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-seal">CM</div>
          <div className="brand-text">
            <b>Contract MS</b>
            <span>Party-Centric · Odoo</span>
          </div>
        </div>
        <nav className="nav-group">
          {role.nav.map((view) => {
            const href = `/${view}`
            const active = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link key={view} href={href} className={`nav-item${active ? ' active' : ''}`}>
                {LABELS[view] ?? view}
              </Link>
            )
          })}
          <Link
            href="/lab/extraction"
            className={`nav-item${pathname.startsWith('/lab/extraction') ? ' active' : ''}`}
          >
            Extraction Lab
          </Link>
        </nav>
        <div className="sidebar-foot">
          {user.name}
          <br />
          <span className="role-badge">{role.label}</span>
          {role.views.includes('audit') && (
            <>
              <br />
              <Link href="/activity" className="sidebar-link">
                Activity Log
              </Link>
            </>
          )}
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
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
