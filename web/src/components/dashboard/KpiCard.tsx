import type { KpiItem } from '@/lib/dashboard/config'

type Props = KpiItem

const TONE_CLASS: Record<string, string> = {
  green: 'kpi-green',
  amber: 'kpi-amber',
  red: 'kpi-red',
  brass: 'kpi-brass',
  '': '',
}

const SUB_CLASS: Record<string, string> = {
  green: 'up',
  amber: 'warn',
  red: 'warn',
  brass: '',
  '': '',
}

function KpiIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
    </svg>
  )
}

export function KpiCard({ label, value, sub, tone = '' }: Props) {
  const toneKey = tone || ''
  return (
    <div className={`kpi-card ${TONE_CLASS[toneKey] ?? ''}`.trim()}>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <div className="kpi-icon">
          <KpiIcon />
        </div>
      </div>
      <div className="kpi-value">{value}</div>
      <div className={`kpi-sub ${SUB_CLASS[toneKey] ?? ''}`.trim()}>{sub}</div>
    </div>
  )
}
