'use client'

import { useMemo, useState } from 'react'
import { signInWithSupabase } from '@/lib/auth/client'
import { AUTH_MODE } from '@/lib/auth/mode'
import type { AppRole, SessionUser } from '@/lib/roles'
import { ROLES } from '@/lib/roles'

type Props = {
  onLogin: (user: SessionUser) => void
}

export function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState('legal.admin@dci.co.id')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<AppRole>('legal')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const roleList = useMemo(() => Object.entries(ROLES) as Array<[AppRole, (typeof ROLES)[AppRole]]>, [])
  const isSupabase = AUTH_MODE === 'supabase'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (isSupabase) {
        if (!password.trim()) {
          setError('Password wajib diisi')
          return
        }
        onLogin(await signInWithSupabase(email, password))
        return
      }

      const name = email
        .split('@')[0]
        .replace(/[.\-]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
      onLogin({ name, role })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <h1>Contract MS</h1>
        <p className="muted">
          Next.js · Supabase · Odoo · RAGFlow
          {isSupabase ? ' · Auth: Supabase' : ' · Auth: mock (dev)'}
        </p>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {isSupabase ? (
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        ) : (
          <div className="field">
            <label htmlFor="role">Role (dev mock)</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value as AppRole)}>
              {roleList.map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>
        )}
        {error && <p className="error-text">{error}</p>}
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? 'Masuk…' : 'Masuk'}
        </button>
        {isSupabase && (
          <p className="muted" style={{ fontSize: 11, marginTop: 8 }}>
            Role diambil dari tabel <code>profiles</code>. Buat user di Supabase Auth Dashboard lalu
            set role via SQL/migration 006.
          </p>
        )}
      </form>
    </div>
  )
}
