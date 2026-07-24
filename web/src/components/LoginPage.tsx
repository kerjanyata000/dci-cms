'use client'

import { useMemo, useState } from 'react'
import { signInWithSupabase } from '@/lib/auth/client'
import { persistSupabaseSession } from '@/lib/auth/client-session'
import { AUTH_MODE } from '@/lib/auth/mode'
import { getSupabaseBrowser } from '@/lib/supabase/client'
import type { AppRole, SessionUser } from '@/lib/roles'
import { ROLES } from '@/lib/roles'

type Props = {
  onLogin: (user: SessionUser) => void
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

const LOGIN_FEATURES = [
  'Tampilan & menu menyesuaikan role (BRD §5)',
  'Legal-managed actions tanpa approval internal (BRL-CMS-007/012/015)',
  'Audit trail lengkap untuk setiap aksi (BRL-CMS-025)',
]

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
        const user = await signInWithSupabase(email, password)
        const { data: sessionData } = await getSupabaseBrowser().auth.getSession()
        if (sessionData.session?.access_token) {
          await persistSupabaseSession(sessionData.session.access_token)
        }
        onLogin(user)
        return
      }

      if (!email.includes('@')) {
        setError('Email tidak valid. Gunakan format email perusahaan.')
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
    <div className="login-page">
      <div className="login-card">
        <aside className="login-side" aria-label="Tentang CMS">
          <div className="brand-seal login-brand-seal">CM</div>
          <h2>Contract Management System</h2>
          <p>
            Party-centric contract registry terintegrasi Odoo &amp; RAGFlow — mengikuti BRD v1.3
            (Contract Management System).
          </p>
          <ul className="login-side-list">
            {LOGIN_FEATURES.map((text) => (
              <li key={text}>
                <CheckIcon />
                {text}
              </li>
            ))}
          </ul>
          <div className="login-side-foot">
            DCI · Contract Management System v1.3
            <br />
            {isSupabase ? 'Auth: Supabase + profiles.role' : 'Dev: mock role picker'}
          </div>
        </aside>

        <form className="login-form" onSubmit={submit}>
          <h1>Masuk ke akun Anda</h1>
          <p>
            {isSupabase
              ? 'Email/password — role dari tabel profiles (FR-DASH-001–002).'
              : 'Pilih role untuk mensimulasikan tampilan & akses sesuai BRD §5 Stakeholders.'}
          </p>

          {error && <div className="login-error show">{error}</div>}

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
            <>
              <div className="field">
                <span className="field-label-block">Login sebagai (role demo)</span>
              </div>
              <div className="role-grid" role="listbox" aria-label="Pilih role">
                {roleList.map(([key, cfg]) => (
                  <button
                    key={key}
                    type="button"
                    role="option"
                    aria-selected={role === key}
                    className={`role-card${role === key ? ' selected' : ''}`}
                    onClick={() => setRole(key)}
                  >
                    <b>{cfg.label}</b>
                    <span>{cfg.desc}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <button className="btn primary login-submit" type="submit" disabled={busy}>
            {busy ? 'Masuk…' : 'Masuk'}
          </button>

          <p className="login-footnote">
            {isSupabase
              ? 'Role diambil dari profiles. Seed: npm run seed:auth'
              : 'Prototype internal — kredensial di atas hanya contoh untuk dev mock.'}
          </p>
        </form>
      </div>
    </div>
  )
}
