'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getReadNotificationIds,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/notifications/read-state'

export function useNotificationReadState() {
  const [readIds, setReadIds] = useState<string[]>([])

  useEffect(() => {
    setReadIds(getReadNotificationIds())
  }, [])

  const markRead = useCallback((id: string) => {
    setReadIds(markNotificationRead(id))
  }, [])

  const markAllRead = useCallback((ids: string[]) => {
    setReadIds(markAllNotificationsRead(ids))
  }, [])

  const isRead = useCallback((id: string) => readIds.includes(id), [readIds])

  return { readIds, markRead, markAllRead, isRead }
}
