'use client'

import { useState } from 'react'
import { RAGFLOW_MODE } from '@/lib/ragflow/client'
import { retrieveFromApi } from '@/lib/ragflow/api'
import { runExtractionPipeline } from '@/lib/pipeline/extraction'
import { RAGFLOW_DATASET_ID } from '@/lib/ragflow/client'
import type { ContractMetadata } from '@/types/cms'

export default function ExtractionLabPage() {
  const [file, setFile] = useState<File | null>(null)
  const [query, setQuery] = useState('auto-renewal')
  const [log, setLog] = useState(`Siap uji RAGFlow (${RAGFLOW_MODE}).`)
  const [extracted, setExtracted] = useState<ContractMetadata | null>(null)
  const [busy, setBusy] = useState(false)

  async function runExtract() {
    if (!file) return
    setBusy(true)
    setLog('Menjalankan pipeline ekstraksi…')
    try {
      const result = await runExtractionPipeline({ file })
      setExtracted(result.extracted)
      setLog(
        `doc=${result.ragflowDocId} · validation=${result.validationStatus} · issues=${result.validationIssues.length}`,
      )
    } catch (err) {
      setLog(err instanceof Error ? err.message : 'Pipeline gagal')
    } finally {
      setBusy(false)
    }
  }

  async function runSearch() {
    setBusy(true)
    try {
      const hits = await retrieveFromApi(RAGFLOW_DATASET_ID, query, 5)
      setLog(hits.map((h) => `(${h.score.toFixed(2)}) ${h.content}`).join('\n') || 'Tidak ada hit.')
    } catch (err) {
      setLog(err instanceof Error ? err.message : 'Retrieve gagal')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>Extraction Lab</h1>
        <p>
          Upload → parse → extract → validate. Mode: Odoo/RAGFlow via server API (
          {RAGFLOW_MODE}).
        </p>
      </div>
      <div className="card stack">
        <div className="field">
          <label htmlFor="file">PDF / DOCX</label>
          <input id="file" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <button className="btn primary" type="button" disabled={!file || busy} onClick={runExtract}>
          {busy ? 'Processing…' : 'Run extraction pipeline'}
        </button>
        <div className="field">
          <label htmlFor="q">Smart search query</label>
          <input id="q" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <button className="btn ghost" type="button" disabled={busy} onClick={runSearch}>
          Retrieve (RAGFlow)
        </button>
        <pre className="mono" style={{ whiteSpace: 'pre-wrap' }}>
          {log}
        </pre>
        {extracted && (
          <pre className="mono" style={{ whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(extracted, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}
