import type { RagflowClient, RagflowExtractResult, RagflowSearchHit, RagflowUploadResult } from './types'

const DATASET = 'cms-contracts'

/** Deterministic fake extraction for UI/dev without RAGFlow running. */
export const dummyRagflowClient: RagflowClient = {
  async uploadDocument(_datasetId, _file, fileName): Promise<RagflowUploadResult> {
    return {
      datasetId: DATASET,
      docId: `dummy-doc-${fileName.replace(/\W+/g, '-').toLowerCase()}`,
      status: 'parsing',
    }
  },

  async extractMetadata(docId): Promise<RagflowExtractResult> {
    return {
      docId,
      status: 'finished',
      confidence: 0.82,
      rawTextPreview: 'Perjanjian Layanan Induk antara DCI dan Counterparty …',
      extracted: {
        counterpartyName: 'PT Alpha Data Center',
        agreementNo: 'ABC/2021/ABC',
        contractPeriod: '36 bulan',
        contractValue: 'IDR 1.200.000.000',
        npwp: '10.20.30.40.50.6000',
        address: 'Jl. Gatot Subroto 1, Jakarta',
        signer: 'Direktur Utama',
        paymentTerm: '30 hari',
        latePaymentPenalty: '1.5% / bulan',
        earlyTerminationFee: 'Enam (6) bulan MRC',
        autoRenewal: 'Ya',
      },
    }
  },

  async retrieve(_datasetId, query, topK = 5): Promise<RagflowSearchHit[]> {
    const q = query.toLowerCase()
    const corpus: RagflowSearchHit[] = [
      {
        docId: 'dummy-doc-msa-alpha',
        content: 'Pasal perpanjangan otomatis (auto-renewal) berlaku untuk 12 bulan berikutnya.',
        score: 0.91,
        metadata: { party_code: 'PTY-00001', agreement_no: 'ABC/2021/ABC' },
      },
      {
        docId: 'dummy-doc-amd-041',
        content: 'Amandemen kapasitas daya dan perpanjangan masa berlaku layanan kolokasi.',
        score: 0.84,
        metadata: { party_code: 'PTY-00041' },
      },
      {
        docId: 'dummy-doc-term-073',
        content: 'Early termination fee sebesar enam bulan MRC apabila pengakhiran sebelum waktunya.',
        score: 0.79,
        metadata: { party_code: 'PTY-00073' },
      },
    ]
    return corpus
      .filter((h) => !q || h.content.toLowerCase().includes(q) || JSON.stringify(h.metadata).toLowerCase().includes(q))
      .slice(0, topK)
  },
}
