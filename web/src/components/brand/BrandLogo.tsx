type Props = {
  /** `full` / `full-light` / `mark` — all use official DCI logo PNG; layout size differs via CSS */
  variant?: 'full' | 'full-light' | 'mark'
  className?: string
}

/** Official DCI Indonesia logo — do not replace with custom artwork */
const OFFICIAL_LOGO = '/brand/dci-logo.png'

export function BrandLogo({ variant = 'full', className }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- official brand PNG from /public
    <img
      src={OFFICIAL_LOGO}
      alt="DCI Indonesia"
      className={`brand-logo brand-logo-${variant}${className ? ` ${className}` : ''}`}
      decoding="async"
    />
  )
}
