'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { EnvironmentBanner } from '@/components/shell/EnvironmentBanner'
import { GlobalSearch } from '@/components/shell/GlobalSearch'
import { IntegrationStatus } from '@/components/shell/IntegrationStatus'
import { NotificationsBell } from '@/components/shell/NotificationsBell'
import { UserProfileMenu } from '@/components/shell/UserProfileMenu'
import { ROLES, type SessionUser } from '@/lib/roles'
import './shell.css'

const SIDEBAR_KEY = 'cms-sidebar-collapsed'

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  parties: 'Parties',
  search: 'Smart Search',
  renewal: 'Renewal Calendar',
  so: 'SO Health',
}

function SidebarToggleIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      {collapsed ? (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M9 4v16" />
          <path d="m14 12 3-3-3-3" />
        </>
      ) : (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M9 4v16" />
          <path d="m16 9-3 3 3 3" />
        </>
      )}
    </svg>
  )
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    try {
      setSidebarCollapsed(localStorage.getItem(SIDEBAR_KEY) === '1')
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1100px)')
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

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

  function toggleSidebar() {
    if (isMobile) {
      setDrawerOpen((v) => !v)
      return
    }
    setSidebarCollapsed((v) => {
      const next = !v
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }

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
    </>
  )

  return (
    <div
      className={`shell${drawerOpen ? ' drawer-open' : ''}${sidebarCollapsed && !isMobile ? ' sidebar-collapsed' : ''}`}
    >
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
          <IntegrationStatus variant="sidebar" />
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button
            type="button"
            className="btn ghost sidebar-toggle"
            aria-label={sidebarCollapsed && !isMobile ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'}
            aria-expanded={isMobile ? drawerOpen : !sidebarCollapsed}
            onClick={toggleSidebar}
          >
            <SidebarToggleIcon collapsed={isMobile ? !drawerOpen : sidebarCollapsed} />
          </button>
          <Suspense fallback={<div className="global-search global-search-fallback" aria-hidden />}>
            <GlobalSearch />
          </Suspense>
          <div className="top-right">
            {sidebarCollapsed && !isMobile && (
              <IntegrationStatus variant="inline" className="topbar-integration" />
            )}
            {role.views.includes('notifications') && <NotificationsBell />}
            <UserProfileMenu user={user} onLogout={onLogout} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </header>
        <main className="content">
          <EnvironmentBanner />
          {children}
        </main>
      </div>
    </div>
  )
}
