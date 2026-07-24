'use client'

import { useEffect, useState } from 'react'
import { ODOO_MODE } from '@/lib/odoo/client'
import { RAGFLOW_MODE } from '@/lib/ragflow/client'

type ConnState = 'live' | 'dummy' | 'offline'

type Props = {
  /** Sidebar = compact on dark bg; inline = for light surfaces */
  variant?: 'sidebar' | 'inline'
  className?: string
}

function deriveState(mode: string, healthy: boolean | null): ConnState {
  if (mode === 'live') {
    if (healthy === false) return 'offline'
    if (healthy === true) return 'live'
    return 'live'
  }
  return 'dummy'
}

const LABELS: Record<ConnState, string> = {
  live: 'Live',
  dummy: 'Dummy',
  offline: 'Offline',
}

function Badge({
  name,
  state,
  title,
  variant,
}: {
  name: string
  state: ConnState
  title: string
  variant: 'sidebar' | 'inline'
}) {
  return (
    <span
      className={`integration-badge ${state} integration-badge-${variant}`}
      title={title}
      aria-label={`${name}: ${LABELS[state]}`}
    >
      <span className="status-dot" aria-hidden />
      <span className="integration-badge-name">{name}</span>
      <span className="integration-badge-state">{LABELS[state]}</span>
    </span>
  )
}

export function IntegrationStatus({ variant = 'sidebar', className }: Props) {
  const [odooOk, setOdooOk] = useState<boolean | null>(null)
  const [ragOk, setRagOk] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false

    async function ping(url: string): Promise<boolean> {
      try {
        const res = await fetch(url, { cache: 'no-store' })
        return res.ok
      } catch {
        return false
      }
    }

    void (async () => {
      const [o, r] = await Promise.all([ping('/api/odoo/health'), ping('/api/ragflow/health')])
      if (!cancelled) {
        setOdooOk(o)
        setRagOk(r)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const odooState = deriveState(ODOO_MODE, odooOk)
  const ragState = deriveState(RAGFLOW_MODE, ragOk)

  return (
    <div
      className={`sys-status sys-status-${variant}${className ? ` ${className}` : ''}`}
      role="status"
      aria-live="polite"
    >
      <Badge
        name="Odoo"
        state={odooState}
        variant={variant}
        title={
          odooState === 'live'
            ? 'Odoo terhubung'
            : odooState === 'dummy'
              ? 'Mode dummy — data simulasi'
              : 'Odoo tidak merespons'
        }
      />
      <Badge
        name="RAGFlow"
        state={ragState}
        variant={variant}
        title={
          ragState === 'live'
            ? 'RAGFlow terhubung'
            : ragState === 'dummy'
              ? 'Mode dummy — ekstraksi simulasi'
              : 'RAGFlow tidak merespons'
        }
      />
    </div>
  )
}
