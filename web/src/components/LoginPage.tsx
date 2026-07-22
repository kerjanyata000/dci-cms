'use client'

import { useMemo, useState } from 'react'
import type { AppRole, SessionUser } from '@/lib/roles'
import { ROLES } from '@/lib/roles'

type Props = {
  onLogin: (user: SessionUser) => void
}

export function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState('legal.admin@dci.co.id')
  const [role, setRole] = useState<AppRole>('legal')
  const roleList = useMemo(() => Object.entries(ROLES) as Array<[AppRole, (typeof ROLES)[AppRole]]>, [])

  return (
    <div className="login-screen">
      <form
        className="login-card"
        onSubmit={(e) => {
          e.preventDefault()
          const name = email
            .split('@')[0]
            .replace(/[.\-]/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase())
          onLogin({ name, role })
        }}
      >
        <h1>Contract MS</h1>
        <p className="muted">Next.js · React · Supabase · Odoo · RAGFlow</p>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="role">Role</label>
          <select id="role" value={role} onChange={(e) => setRole(e.target.value as AppRole)}>
            {roleList.map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>
        </div>
        <button className="btn primary" type="submit">
          Masuk
        </button>
      </form>
    </div>
  )
}
