import Link from 'next/link'

type Action = {
  label: string
  href?: string
  onClick?: () => void
}

type Props = {
  title: string
  description?: string
  primaryAction?: Action
  secondaryAction?: Action
}

export function EmptyState({ title, description, primaryAction, secondaryAction }: Props) {
  return (
    <div className="empty-state card stack">
      <h2>{title}</h2>
      {description && <p className="muted">{description}</p>}
      {(primaryAction || secondaryAction) && (
        <div className="empty-state-actions">
          {primaryAction &&
            (primaryAction.href ? (
              <Link href={primaryAction.href} className="btn primary">
                {primaryAction.label}
              </Link>
            ) : (
              <button type="button" className="btn primary" onClick={primaryAction.onClick}>
                {primaryAction.label}
              </button>
            ))}
          {secondaryAction &&
            (secondaryAction.href ? (
              <Link href={secondaryAction.href} className="btn ghost">
                {secondaryAction.label}
              </Link>
            ) : (
              <button type="button" className="btn ghost" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
