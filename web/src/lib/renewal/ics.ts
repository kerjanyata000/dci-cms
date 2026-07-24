import type { RenewalAgendaItem } from '@/lib/renewal/types'

const KIND_LABEL: Record<string, string> = {
  renewal: 'Renewal',
  expiry: 'Expiry',
  termination: 'Termination',
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/\n/g, '\\n')
}

function toIcsDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, '')
}

function formatStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

export function buildRenewalIcs(items: RenewalAgendaItem[]): string {
  const stamp = formatStamp(new Date())
  const events = items.map((item) => {
    const summary = `${KIND_LABEL[item.kind] ?? item.kind} — ${item.partyCode}`
    const description = [
      item.contractCode ? `Kontrak: ${item.contractCode}` : '',
      item.partyName,
      item.durationLabel,
      `${item.daysLeft} hari lagi`,
    ]
      .filter(Boolean)
      .join(' · ')

    return [
      'BEGIN:VEVENT',
      `UID:renewal-${item.id}@dci-cms`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(item.eventDate)}`,
      `SUMMARY:${escapeIcs(summary)}`,
      `DESCRIPTION:${escapeIcs(description)}`,
      'END:VEVENT',
    ].join('\r\n')
  })

  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DCI CMS//Renewal//EN', ...events, 'END:VCALENDAR'].join(
    '\r\n',
  )
}

export function downloadRenewalIcs(items: RenewalAgendaItem[], filename?: string) {
  const body = buildRenewalIcs(items)
  const blob = new Blob([body], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename ?? `dci-renewal-${new Date().toISOString().slice(0, 10)}.ics`
  a.click()
  URL.revokeObjectURL(url)
}
