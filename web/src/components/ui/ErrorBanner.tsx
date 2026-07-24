type Props = {
  message: string
  onRetry?: () => void
  retryLabel?: string
}

export function ErrorBanner({ message, onRetry, retryLabel = 'Coba lagi' }: Props) {
  return (
    <div className="error-banner" role="alert">
      <p className="error-text">{message}</p>
      {onRetry && (
        <button type="button" className="btn ghost small" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  )
}
