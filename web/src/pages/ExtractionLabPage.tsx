import { useState } from 'react'
import { getRagflowClient, RAGFLOW_DATASET_ID } from '../lib/ragflow/client'
import { runExtractionPipeline } from '../lib/pipeline/extraction'
import type { ContractMetadata } from '../types/cms'

export function ExtractionLabPage() {
  const [file, setFile] = useState<File | null>(null)
  const [query, setQuery] = useState('auto-renewal')
  const [log, setLog] = useState<string>('Siap uji adapter RAGFlow dummy.')
  const [extracted, setExtracted] = useState<ContractMetadata | null>(null)

  async function runExtract() {
    if (!file) return
    setLog('Menjalankan pipeline ekstraksi…')
    const result = await runExtractionPipeline({ file, odooPartnerId: 101 })
    setExtracted(result.extracted)
    setLog(
      `doc=${result.ragflowDocId} · validation=${result.validationStatus} · issues=${result.validationIssues.length}`,
    )
  }

  async function runSearch() {
    const client = getRagflowClient()
    const hits = await client.retrieve(RAGFLOW_DATASET_ID, query, 5)
    setLog(hits.map((h) => `(${h.score.toFixed(2)}) ${h.content}`).join('\n') || 'Tidak ada hit.')
  }

  return (
    <div>
      <div className="page-head">
        <h1>Extraction Lab</h1>
        <p>POC alur RAGFlow dummy: upload → extract → validate (+ Odoo Partner) → retrieve.</p>
      </div>
      <div className="card stack">
        <div className="field">
          <label htmlFor="file">PDF / DOCX (dummy tidak benar-benar di-parse)</label>
          <input
            id="file"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <button className="btn primary" type="button" disabled={!file} onClick={runExtract}>
          Run extraction pipeline
        </button>
        <div className="field">
          <label htmlFor="q">Smart search query</label>
          <input id="q" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <button className="btn ghost" type="button" onClick={runSearch}>
          Retrieve (RAGFlow dummy)
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
