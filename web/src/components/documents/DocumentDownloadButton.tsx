'use client'

import { useState } from 'react'
import { openDocumentDownload } from '@/lib/documents/api'

type Props = {
  documentId: string
  label?: string
  className?: string
}

export function DocumentDownloadButton({ documentId, label = 'Download', className }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    setBusy(true)
    setError('')
    try {
      await openDocumentDownload(documentId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download gagal')
    } finally {
      setBusy(false)
    }
  }

  return (
    <span className="doc-download-wrap">
      <button
        type="button"
        className={className ?? 'btn ghost'}
        disabled={busy}
        onClick={() => void handleClick()}
      >
        {busy ? '…' : label}
      </button>
      {error && <span className="error-text" style={{ fontSize: 11, marginLeft: 6 }}>{error}</span>}
    </span>
  )
}
