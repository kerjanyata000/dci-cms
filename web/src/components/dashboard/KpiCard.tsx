import type { KpiItem } from '@/lib/dashboard/config'

type Props = KpiItem

const TONE_CLASS: Record<string, string> = {
  green: 'kpi-green',
  amber: 'kpi-amber',
  red: 'kpi-red',
  brass: 'kpi-brass',
  '': '',
}

function KpiIcon({ name }: { name: NonNullable<KpiItem['icon']> }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    'aria-hidden': true as const,
  }

  switch (name) {
    case 'parties':
      return (
        <svg {...common}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    case 'contracts':
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
          <path d="M10 9H8" />
        </svg>
      )
    case 'active':
      return (
        <svg {...common}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="M22 4 12 14.01l-3-3" />
        </svg>
      )
    case 'review':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
          <path d="M11 8v6" />
          <path d="M8 11h6" />
        </svg>
      )
    case 'renewal':
      return (
        <svg {...common}>
          <path d="M23 4v6h-6" />
          <path d="M1 20v-6h6" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      )
    case 'sync':
      return (
        <svg {...common}>
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
          <path d="M16 16h5v5" />
        </svg>
      )
    case 'quote':
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h2" />
          <path d="M8 17h8" />
        </svg>
      )
    case 'alert':
      return (
        <svg {...common}>
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      )
    case 'link':
      return (
        <svg {...common}>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      )
    case 'audit':
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
          <path d="M10 9H8" />
        </svg>
      )
    case 'sign':
      return (
        <svg {...common}>
          <path d="M12 19h8" />
          <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
      )
    case 'draft':
      return (
        <svg {...common}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4" />
          <path d="M8 2v4" />
          <path d="M3 10h18" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      )
  }
}

export function KpiCard({ label, value, sub, tone = '', icon = 'contracts' }: Props) {
  const toneKey = tone || ''
  return (
    <div className={`kpi-card ${TONE_CLASS[toneKey] ?? ''}`.trim()}>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <div className="kpi-icon">
          <KpiIcon name={icon} />
        </div>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-divider" aria-hidden />
      <div className="kpi-sub">{sub}</div>
    </div>
  )
}
