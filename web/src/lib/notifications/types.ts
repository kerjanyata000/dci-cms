export type NotificationLevel = 'danger' | 'warning' | 'normal'

export type NotificationItem = {
  id: string
  code: string
  title: string
  sub: string
  urgent: boolean
  level: NotificationLevel
  href?: string
  created_at: string
}

const WARNING_CODES = new Set([
  'NOTIF-CMS-003',
  'NOTIF-CMS-004',
  'NOTIF-CMS-007',
  'NOTIF-CMS-010',
  'NOTIF-CMS-014',
  'NOTIF-CMS-015',
  'NOTIF-CMS-016',
  'NOTIF-CMS-019',
])

export function resolveNotificationLevel(opts: {
  urgent?: boolean
  warning?: boolean
  code?: string
}): NotificationLevel {
  if (opts.urgent) return 'danger'
  if (opts.warning) return 'warning'
  if (opts.code && WARNING_CODES.has(opts.code)) return 'warning'
  return 'normal'
}
