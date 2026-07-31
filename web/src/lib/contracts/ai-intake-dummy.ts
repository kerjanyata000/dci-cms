import type { ContractMetadata } from '@/types/cms'
import type { RagflowExtractResult } from '@/lib/ragflow/types'
import type { GuidelineCategory } from '@/lib/contracts/guidelines'

/** Filename / context-aware dummy extraction for AI intake wizard (dev / non-live RAGFlow). */
export function buildDummyAiExtraction(
  fileName: string,
  contextPartyName?: string | null,
): RagflowExtractResult & { suggestedCategory: GuidelineCategory } {
  const lower = fileName.toLowerCase()
  const docId = `dummy-doc-${fileName.replace(/\W+/g, '-').toLowerCase()}`

  if (/\b(loan|facility|bank)\b/.test(lower)) {
    return {
      docId,
      status: 'finished',
      confidence: 0.78,
      suggestedCategory: 'Loan',
      rawTextPreview:
        'Facility Agreement — Working Capital antara Bank X Indonesia dan DCI. Plafond IDR 5.000.000.000. Tenor 36 bulan. Covenant reporting quarterly. Event of default dengan cure period 15 hari. Collateral to be agreed.',
      extracted: {
        counterpartyName: 'Bank X Indonesia',
        agreementNo: 'FA/BANKX/2026/07',
        contractPeriod: '36 bulan',
        contractValue: 'IDR 5.000.000.000',
        paymentTerm: '—',
        autoRenewal: 'Tidak',
      },
    }
  }

  if (/\b(vendor|supply|pengadaan|procurement)\b/.test(lower)) {
    return {
      docId,
      status: 'finished',
      confidence: 0.8,
      suggestedCategory: 'Vendor',
      rawTextPreview:
        'Perjanjian Pengadaan Barang & Jasa dengan PT Sumber Daya Baru. Scope deliverables dan SLA tercantum. Payment Net 45. Indemnity untuk IP infringement. Termination hanya for cause.',
      extracted: {
        counterpartyName: 'PT Sumber Daya Baru',
        agreementNo: 'VND/2026/044',
        contractPeriod: '12 bulan',
        contractValue: 'IDR 48.000.000',
        paymentTerm: 'Net 45',
        npwp: '01.999.888.7-666.000',
      },
    }
  }

  const party = contextPartyName?.trim() || 'PT Alpha Data Center'
  return {
    docId,
    status: 'finished',
    confidence: 0.84,
    suggestedCategory: 'Customer',
    rawTextPreview: `Master Services Agreement antara DCI dan ${party}. Masa berlaku 36 bulan dengan perpanjangan otomatis kecuali notice H-30. Termination notice “reasonable time”. Late payment 1.5%/bulan. Tidak ada liability cap tertulis.`,
    extracted: {
      counterpartyName: party,
      agreementNo: 'MSA/2026/001',
      contractPeriod: '36 bulan',
      contractValue: 'IDR 125.000.000 / tahun',
      paymentTerm: '30 hari',
      latePaymentPenalty: '1.5% / bulan',
      autoRenewal: 'Ya',
      earlyTerminationFee: 'Enam (6) bulan MRC',
    } satisfies ContractMetadata,
  }
}
