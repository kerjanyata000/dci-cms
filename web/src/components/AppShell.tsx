import { NavLink, Outlet } from 'react-router-dom'
import { ROLES, type SessionUser } from '../lib/roles'
import { ODOO_MODE } from '../lib/odoo/client'
import { RAGFLOW_MODE } from '../lib/ragflow/client'
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
}

export function AppShell({ user, onLogout }: Props) {
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
          {role.nav.map((view) => (
            <NavLink
              key={view}
              to={`/${view}`}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              {LABELS[view] ?? view}
            </NavLink>
          ))}
          <NavLink
            to="/lab/extraction"
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            Extraction Lab
          </NavLink>
        </nav>
        <div className="sidebar-foot">
          {user.name}
          <br />
          <span className="role-badge">{role.label}</span>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="topbar-modes">
            Odoo: {ODOO_MODE.toUpperCase()} · RAGFlow: {RAGFLOW_MODE.toUpperCase()}
          </div>
          <div className="top-right">
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
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
