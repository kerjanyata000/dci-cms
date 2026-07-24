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

const LOGIN_TRUST = [
  { label: 'Party-centric', detail: 'Registry utama per counterparty' },
  { label: 'Odoo + RAGFlow', detail: 'Integrasi consume-only' },
  { label: 'Audit trail', detail: 'Setiap aksi tercatat' },
]

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

export function LoginPageSkeleton() {
  return (
    <div className="login-page" aria-busy="true" aria-label="Memuat halaman login">
      <div className="login-card login-card-skeleton">
        <div className="login-side skeleton-block" />
        <div className="login-form">
          <div className="skeleton-line" style={{ width: '60%', height: 26, marginBottom: 12 }} />
          <div className="skeleton-line" style={{ width: '85%', height: 14, marginBottom: 24 }} />
          <div className="skeleton-block" style={{ height: 42, marginBottom: 12 }} />
          <div className="skeleton-block" style={{ height: 120, marginBottom: 16 }} />
          <div className="skeleton-block" style={{ height: 44 }} />
        </div>
      </div>
    </div>
  )
}

export function LoginPage({ onLogin }: Props) {
  const isSupabase = AUTH_MODE === 'supabase'
  const [email, setEmail] = useState(isSupabase ? '' : 'legal.admin@dci.co.id')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<AppRole>('legal')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const roleList = useMemo(() => Object.entries(ROLES) as Array<[AppRole, (typeof ROLES)[AppRole]]>, [])

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
          <div className="login-side-top">
            <div className="brand-seal login-brand-seal">CM</div>
            <p className="login-product-tag">DCI · Contract Management System</p>
          </div>
          <h2>Sealed Registry untuk kontrak enterprise</h2>
          <p>
            Party-centric contract registry terintegrasi Odoo &amp; RAGFlow — mengikuti BRD v1.3
            dengan RBAC per stakeholder internal.
          </p>
          <ul className="login-side-list">
            {LOGIN_FEATURES.map((text) => (
              <li key={text}>
                <CheckIcon />
                {text}
              </li>
            ))}
          </ul>
          <div className="login-trust-row" aria-label="Trust signals">
            {LOGIN_TRUST.map((item) => (
              <div key={item.label} className="login-trust-chip">
                <b>{item.label}</b>
                <span>{item.detail}</span>
              </div>
            ))}
          </div>
          <div className="login-side-foot">
            {isSupabase ? 'Auth: Supabase + profiles.role' : 'Dev: mock role picker · FR-DASH-001'}
          </div>
        </aside>

        <form className="login-form" onSubmit={submit}>
          <div className="login-mobile-brand" aria-hidden>
            <div className="brand-seal login-brand-seal">CM</div>
            <div>
              <b>Contract MS</b>
              <span>Party-Centric · Odoo</span>
            </div>
          </div>

          <div className="login-form-head">
            <p className="login-form-eyebrow">Enterprise gateway</p>
            <h1>Masuk ke akun Anda</h1>
            <p className="login-form-lead">
              {isSupabase
                ? 'Email & password — role dari tabel profiles (FR-DASH-001–002).'
                : 'Pilih role demo untuk mensimulasikan workspace & menu sesuai BRD §5.'}
            </p>
          </div>

          {error && <div className="login-error show">{error}</div>}

          <div className="field">
            <label htmlFor="email">Email perusahaan</label>
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

          {isSupabase ? (
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
                    className={`role-card role-card-${key}${role === key ? ' selected' : ''}`}
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
            {busy ? 'Masuk…' : 'Masuk ke workspace'}
            {!busy && <ArrowIcon />}
          </button>

          <p className="login-footnote">
            {isSupabase
              ? 'Role diambil dari profiles. Seed: npm run seed:auth'
              : 'Prototype internal — email di atas hanya contoh dev mock.'}
          </p>
        </form>
      </div>
    </div>
  )
}
