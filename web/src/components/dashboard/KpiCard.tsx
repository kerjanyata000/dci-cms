import type { KpiItem } from '@/lib/dashboard/config'

type Props = KpiItem

const TONE_CLASS: Record<string, string> = {
  green: 'kpi-green',
  amber: 'kpi-amber',
  red: 'kpi-red',
  brass: 'kpi-brass',
  '': '',
}

export function KpiCard({ label, value, sub, tone = '' }: Props) {
  return (
    <div className={`kpi-card ${TONE_CLASS[tone] ?? ''}`.trim()}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  )
}
