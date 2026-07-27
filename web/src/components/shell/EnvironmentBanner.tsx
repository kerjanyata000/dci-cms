import { AUTH_MODE } from '@/lib/auth/mode'

const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV ?? 'development'

export function EnvironmentBanner() {
  const isMock = AUTH_MODE === 'mock'
  const showDev = APP_ENV !== 'production' || isMock

  if (!showDev) return null

  return (
    <div className="env-banner" role="status">
      <span className="env-banner-dot" aria-hidden />
      {isMock ? (
        <>
          <b>Prototype mock</b> — role picker · set Supabase keys + hapus AUTH_MODE=mock untuk Auth nyata
        </>
      ) : (
        <>
          <b>{APP_ENV.toUpperCase()}</b> · Supabase Auth · profiles.role
        </>
      )}
    </div>
  )
}
