const STORAGE_KEY = 'cms.notif.read'

export function getReadNotificationIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function saveReadNotificationIds(ids: string[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    /* ignore */
  }
}

export function markNotificationRead(id: string): string[] {
  const set = new Set(getReadNotificationIds())
  set.add(id)
  const next = [...set]
  saveReadNotificationIds(next)
  return next
}

export function markAllNotificationsRead(ids: string[]): string[] {
  const set = new Set([...getReadNotificationIds(), ...ids])
  const next = [...set]
  saveReadNotificationIds(next)
  return next
}
