export function LoginRedirectOverlay() {
  return (
    <div className="login-page login-redirect" aria-busy="true" aria-label="Masuk ke workspace">
      <div className="login-redirect-card">
        <div className="login-redirect-spinner" aria-hidden />
        <p className="login-redirect-title">Masuk ke workspace…</p>
        <p className="muted">Memuat dashboard sesuai role Anda.</p>
      </div>
    </div>
  )
}
