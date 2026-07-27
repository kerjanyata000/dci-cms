'use client'

import { useMemo, useState } from 'react'
import { signInWithSupabase } from '@/lib/auth/client'
import { persistSupabaseSession } from '@/lib/auth/client-session'
import { DEMO_AUTH_ACCOUNTS } from '@/lib/auth/demo-accounts'
import type { AuthMode } from '@/lib/auth/mode-types'
import { AUTH_MODE } from '@/lib/auth/mode'
import { getSupabaseBrowser } from '@/lib/supabase/client'
import type { AppRole, SessionUser } from '@/lib/roles'
import { ROLES } from '@/lib/roles'

type Props = {
  onLogin: (user: SessionUser) => void | Promise<void>
  authMode?: AuthMode
  errorHint?: string
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

/** Demo passwords — only bundled/used outside production builds */
const DEMO_PASSWORDS: Record<string, string> =
  process.env.NODE_ENV === 'production'
    ? {}
    : {
        'legal.admin@dci.co.id': 'DemoLegal123!',
        'business.user@dci.co.id': 'DemoBusiness123!',
        'finance.user@dci.co.id': 'DemoFinance123!',
        'mgmt.user@dci.co.id': 'DemoMgmt123!',
        'it.ops@dci.co.id': 'DemoIt123!',
      }

const showDemoFill = process.env.NODE_ENV !== 'production'

export function LoginPageSkeleton() {
  return (
    <div className="login-page" aria-busy="true" aria-label="Memuat halaman login">
      <div className="login-card login-card-skeleton">
        <div className="login-side skeleton-block" />
        <div className="login-form">
          <div className="skeleton-line" style={{ width: '60%', height: 26, marginBottom: 12 }} />
          <div className="skeleton-line" style={{ width: '85%', height: 14, marginBottom: 24 }} />
          <div className="skeleton-block" style={{ height: 120, marginBottom: 16 }} />
          <div className="skeleton-block" style={{ height: 44 }} />
        </div>
      </div>
    </div>
  )
}

export function LoginPage({ onLogin, authMode = AUTH_MODE, errorHint }: Props) {
  const isSupabase = authMode === 'supabase'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<AppRole>('legal')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const roleList = useMemo(() => Object.entries(ROLES) as Array<[AppRole, (typeof ROLES)[AppRole]]>, [])

  function fillDemo(accountEmail: string) {
    setEmail(accountEmail)
    setPassword(DEMO_PASSWORDS[accountEmail] ?? '')
    setError('')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (isSupabase) {
        if (!email.trim() || !password.trim()) {
          setError('Email dan password wajib diisi')
          return
        }
        const user = await signInWithSupabase(email, password)
        const { data: sessionData } = await getSupabaseBrowser().auth.getSession()
        if (sessionData.session?.access_token) {
          await persistSupabaseSession(sessionData.session.access_token)
        }
        await onLogin(user)
        return
      }

      await onLogin({ name: ROLES[role].defaultName, role })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <aside className="login-side" aria-label="Brand">
          <div className="login-side-top">
            <div className="brand-seal login-brand-seal">CM</div>
            <p className="login-product-tag">DCI · Contract Management System</p>
          </div>
          <h2>Contract Management System</h2>
        </aside>

        <form className="login-form" onSubmit={submit}>
          <div className="login-mobile-brand" aria-hidden>
            <div className="brand-seal login-brand-seal">CM</div>
            <div>
              <b>Contract MS</b>
            </div>
          </div>

          <div className="login-form-head">
            <h1>{isSupabase ? 'Masuk' : 'Pilih role'}</h1>
          </div>

          {(error || errorHint) && (
            <div className="login-error show">{error || errorHint}</div>
          )}

          {isSupabase ? (
            <>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="nama@dci.co.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {showDemoFill && (
                <div className="field">
                  <label>Akun demo UAT</label>
                  <div className="row-actions" style={{ flexWrap: 'wrap', gap: 6 }}>
                    {DEMO_AUTH_ACCOUNTS.map((a) => (
                      <button
                        key={a.email}
                        type="button"
                        className="btn ghost small"
                        onClick={() => fillDemo(a.email)}
                      >
                        {ROLES[a.role].label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="role-grid" role="listbox" aria-label="Pilih role">
              {roleList.map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  role="option"
                  aria-selected={role === key}
                  className={`role-card role-card-${key}${role === key ? ' selected' : ''}`}
                  onClick={() => setRole(key)}
                >
                  <b>{cfg.label}</b>
                </button>
              ))}
            </div>
          )}

          <button className="btn primary login-submit" type="submit" disabled={busy}>
            {busy ? 'Masuk…' : 'Masuk'}
            {!busy && <ArrowIcon />}
          </button>
        </form>
      </div>
    </div>
  )
}
