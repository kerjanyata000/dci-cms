'use client'

import { useState } from 'react'
import { RAGFLOW_MODE } from '@/lib/ragflow/client'
import { retrieveFromApi } from '@/lib/ragflow/api'
import { runExtractionPipeline } from '@/lib/pipeline/extraction'
import { RAGFLOW_DATASET_ID } from '@/lib/ragflow/client'
import type { ContractMetadata } from '@/types/cms'
import type { RagflowSearchHit } from '@/lib/ragflow/types'

type SearchScope = 'cms' | 'dataset'

export default function ExtractionLabPage() {
  const [file, setFile] = useState<File | null>(null)
  const [query, setQuery] = useState('perpanjangan otomatis')
  const [searchScope, setSearchScope] = useState<SearchScope>('cms')
  const [log, setLog] = useState(`Siap uji RAGFlow (${RAGFLOW_MODE}).`)
  const [hits, setHits] = useState<RagflowSearchHit[]>([])
  const [extracted, setExtracted] = useState<ContractMetadata | null>(null)
  const [busy, setBusy] = useState(false)

  async function runExtract() {
    if (!file) return
    setBusy(true)
    setLog('Menjalankan pipeline ekstraksi…')
    setHits([])
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
    setHits([])
    try {
      const cmsOnly = searchScope === 'cms'
      const result = await retrieveFromApi(RAGFLOW_DATASET_ID, query, {
        topK: 5,
        cmsOnly,
        similarityThreshold: cmsOnly ? 0.3 : 0.35,
      })

      setHits(result)

      if (!result.length) {
        setLog(
          cmsOnly
            ? 'Tidak ada hit dari kontrak CMS. Upload PDF lewat Add Contract (Party Detail) dulu, atau ganti scope ke "Seluruh dataset".'
            : 'Tidak ada chunk relevan di dataset RAGFlow untuk query ini.',
        )
        return
      }

      if (!cmsOnly) {
        setLog(
          `${result.length} hit dari seluruh dataset. Chunk BRD/requirements muncul jika dokumen BRD ikut terindeks di RAGFlow — bukan isi kontrak party.`,
        )
      } else {
        setLog(`${result.length} hit dari dokumen kontrak CMS saja (filter document_ids).`)
      }
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

      <div className="notice" style={{ marginBottom: 16 }}>
        <div>
          <b>Mengapa retrieve menampilkan tabel HTML / teks BRD?</b> Dataset RAGFlow sering
          berisi banyak dokumen (mis. BRD PDF yang pernah di-upload untuk uji). Semantic search{' '}
          <i>auto-renewal</i> cocok dengan bagian Notifications/Renewal di BRD — bukan pasal kontrak.
          Production Smart Search hanya mencari dokumen kontrak CMS. Lab: pilih scope di bawah.
        </div>
      </div>

      <div className="card stack">
        <div className="field">
          <label htmlFor="file">PDF / DOCX</label>
          <input id="file" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <button className="btn primary" type="button" disabled={!file || busy} onClick={runExtract}>
          {busy ? 'Processing…' : 'Run extraction pipeline'}
        </button>

        <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '8px 0' }} />

        <div className="field">
          <label htmlFor="q">Smart search query</label>
          <input id="q" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        <div className="search-tags">
          <button
            type="button"
            className={`filter-chip clickable${searchScope === 'cms' ? ' active' : ''}`}
            onClick={() => setSearchScope('cms')}
          >
            Kontrak CMS saja
          </button>
          <button
            type="button"
            className={`filter-chip clickable${searchScope === 'dataset' ? ' active' : ''}`}
            onClick={() => setSearchScope('dataset')}
          >
            Seluruh dataset RAGFlow
          </button>
        </div>

        <button className="btn ghost" type="button" disabled={busy || !query.trim()} onClick={runSearch}>
          Retrieve (RAGFlow)
        </button>

        <p className="muted" style={{ fontSize: 12, margin: 0 }}>
          {log}
        </p>

        {hits.length > 0 && (
          <div className="stack lab-hits">
            {hits.map((h, i) => (
              <div key={`${h.docId}-${i}`} className="search-content-hit">
                <div className="search-content-meta">
                  <span className="mono">{(h.score * 100).toFixed(0)}%</span>
                  {h.fileName ? (
                    <b style={{ marginLeft: 8 }}>{h.fileName}</b>
                  ) : (
                    <span className="muted" style={{ marginLeft: 8 }}>
                      doc {h.docId.slice(0, 8)}… (bukan kontrak CMS)
                    </span>
                  )}
                  {h.cmsLinked && (
                    <span className="pill" style={{ marginLeft: 8 }}>
                      CMS
                    </span>
                  )}
                </div>
                <p className="search-content-snippet">{h.displayContent ?? h.content}</p>
              </div>
            ))}
          </div>
        )}

        {extracted && (
          <pre className="mono" style={{ whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(extracted, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}
