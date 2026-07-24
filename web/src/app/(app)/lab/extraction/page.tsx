'use client'

import { useState } from 'react'
import { RAGFLOW_MODE } from '@/lib/ragflow/client'
import { retrieveFromApi } from '@/lib/ragflow/api'
import { runExtractionPipeline } from '@/lib/pipeline/extraction'
import { RAGFLOW_DATASET_ID } from '@/lib/ragflow/client'
import type { ContractMetadata } from '@/types/cms'
import type { RagflowSearchHit } from '@/lib/ragflow/types'

type SearchScope = 'cms' | 'dataset'

const METADATA_FIELDS: Array<{ key: keyof ContractMetadata; label: string }> = [
  { key: 'counterpartyName', label: 'Counterparty' },
  { key: 'agreementNo', label: 'Agreement No' },
  { key: 'contractValue', label: 'Contract Value' },
  { key: 'paymentTerm', label: 'Payment Term' },
  { key: 'contractPeriod', label: 'Contract Period' },
  { key: 'autoRenewal', label: 'Auto Renewal' },
  { key: 'governingLaw', label: 'Governing Law' },
]

export default function ExtractionLabPage() {
  const [file, setFile] = useState<File | null>(null)
  const [query, setQuery] = useState('perpanjangan otomatis')
  const [searchScope, setSearchScope] = useState<SearchScope>('cms')
  const [log, setLog] = useState(`Siap uji RAGFlow (${RAGFLOW_MODE}).`)
  const [hits, setHits] = useState<RagflowSearchHit[]>([])
  const [extracted, setExtracted] = useState<ContractMetadata | null>(null)
  const [validationStatus, setValidationStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function runExtract() {
    if (!file) return
    setBusy(true)
    setLog('Menjalankan pipeline ekstraksi…')
    setHits([])
    setExtracted(null)
    setValidationStatus(null)
    try {
      const result = await runExtractionPipeline({ file })
      setExtracted(result.extracted)
      setValidationStatus(result.validationStatus)
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
    <div className="lab-page">
      <div className="page-head page-head-spread">
        <div>
          <div className="crumb">Internal</div>
          <h1>Extraction Lab</h1>
          <p>Upload → parse → extract → validate · uji RAGFlow ({RAGFLOW_MODE}).</p>
        </div>
        <span className="lab-internal-badge">INTERNAL ONLY</span>
      </div>

      <div className="notice lab-notice">
        <div>
          <b>Bukan halaman production.</b> Retrieve bisa menampilkan chunk BRD jika scope &quot;Seluruh
          dataset&quot;. Smart Search production hanya mencari dokumen kontrak CMS.
        </div>
      </div>

      <div className="card stack lab-card">
        <h2 className="lab-section-title">Extraction pipeline</h2>
        <label className="file-upload-zone" htmlFor="lab-file">
          <input
            id="lab-file"
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="file-upload-input"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <>
              <b>{file.name}</b>
              <span className="muted">{(file.size / 1024).toFixed(1)} KB · klik untuk ganti file</span>
            </>
          ) : (
            <>
              <b>Pilih PDF / DOCX</b>
              <span className="muted">Seret atau klik untuk upload dokumen uji</span>
            </>
          )}
        </label>
        <button className="btn primary" type="button" disabled={!file || busy} onClick={runExtract}>
          {busy ? 'Processing…' : 'Run extraction pipeline'}
        </button>

        {extracted && (
          <section className="lab-result-card stack">
            <div className="lab-result-head">
              <h3>Hasil ekstraksi</h3>
              {validationStatus && (
                <span className={`status-pill ${validationStatus === 'valid' ? 'active' : 'pending'}`}>
                  {validationStatus}
                </span>
              )}
            </div>
            <div className="info-grid info-grid-3">
              {METADATA_FIELDS.map(({ key, label }) => {
                const val = extracted[key]
                if (val == null || val === '') return null
                return (
                  <div key={key} className="info-item">
                    <span className="info-label">{label}</span>
                    <div className="info-value">
                      <b>{String(val)}</b>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        <hr className="lab-divider" />

        <h2 className="lab-section-title">RAGFlow retrieve</h2>
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

        <p className="muted lab-log" aria-live="polite">
          {busy ? 'Memproses…' : log}
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
                    <span className="status-pill linked" style={{ marginLeft: 8 }}>
                      CMS
                    </span>
                  )}
                </div>
                <p className="search-content-snippet">{h.displayContent ?? h.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
