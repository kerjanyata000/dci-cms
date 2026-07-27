'use client'

import { useEffect, useState } from 'react'

type Props = {
  onStuck?: () => void
}

/** Shown while redirecting after login. Escape hatch if middleware cookie race loops. */
export function LoginRedirectOverlay({ onStuck }: Props) {
  const [showEscape, setShowEscape] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowEscape(true), 6000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="login-page login-redirect" aria-busy="true" aria-label="Masuk ke workspace">
      <div className="login-redirect-card">
        <div className="login-redirect-spinner" aria-hidden />
        <p className="login-redirect-title">Masuk ke workspace…</p>
        <p className="muted">Memuat dashboard sesuai role Anda.</p>
        {showEscape && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <p className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
              Terlalu lama? Biasanya cookie sesi belum siap — coba ulang login.
            </p>
            <button type="button" className="btn ghost small" onClick={() => onStuck?.()}>
              Kembali ke login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
