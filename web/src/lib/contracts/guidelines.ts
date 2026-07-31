/** Guideline packs per contract category — assisted checklist (bukan nasihat hukum bersertifikat). */

export type GuidelineCategory = 'Customer' | 'Vendor' | 'Loan'

export type GuidelineAlertStatus = 'ok' | 'warn' | 'bad'

export type GuidelineAlert = {
  clause: string
  status: GuidelineAlertStatus
  label: string
  detail: string
}

const LABEL: Record<GuidelineAlertStatus, string> = {
  ok: 'Sesuai',
  warn: 'Ambigu',
  bad: 'Tidak sesuai',
}

function alert(
  clause: string,
  status: GuidelineAlertStatus,
  detail: string,
): GuidelineAlert {
  return { clause, status, label: LABEL[status], detail }
}

/** Heuristic checklist from extracted metadata + raw text (POC; refine with Legal playbooks). */
export function evaluateGuidelines(
  category: GuidelineCategory,
  opts: {
    extracted: Record<string, string | undefined>
    rawText?: string
  },
): GuidelineAlert[] {
  const text = `${opts.rawText ?? ''} ${Object.values(opts.extracted).join(' ')}`.toLowerCase()
  const has = (...keys: string[]) => keys.some((k) => text.includes(k.toLowerCase()))
  const meta = opts.extracted

  if (category === 'Vendor') {
    return [
      alert(
        'Scope & deliverables',
        has('scope', 'deliverable', 'sla', 'lingkup') ? 'ok' : 'warn',
        has('scope', 'deliverable', 'sla', 'lingkup')
          ? 'Lingkup / SLA terdeteksi di dokumen.'
          : 'Scope/SLA belum jelas — pastikan deliverables tertulis.',
      ),
      alert(
        'Payment terms',
        meta.paymentTerm || has('net 30', '30 hari', 'payment')
          ? has('net 45', '45 hari', 'net 60')
            ? 'warn'
            : 'ok'
          : 'bad',
        has('net 45', '45 hari', 'net 60')
          ? 'Payment term lebih panjang dari guide Vendor (maks Net 30) — perlu exception note.'
          : meta.paymentTerm || has('payment', '30 hari')
            ? 'Payment term terdeteksi.'
            : 'Payment term tidak ditemukan.',
      ),
      alert(
        'Indemnity',
        has('indemn', 'ganti rugi', 'indemnity') ? 'ok' : 'warn',
        has('indemn', 'ganti rugi')
          ? 'Klausul indemnity terdeteksi.'
          : 'Indemnity belum jelas — guide Vendor minta proteksi IP/claim pihak ketiga.',
      ),
      alert(
        'Termination for convenience',
        has('convenience', 'tanpa sebab', 'for convenience') ? 'ok' : 'bad',
        has('convenience', 'tanpa sebab')
          ? 'Termination for convenience terdeteksi.'
          : 'Guide Vendor minta convenience + notice 60 hari — belum terdeteksi.',
      ),
    ]
  }

  if (category === 'Loan') {
    return [
      alert(
        'Facility amount & tenor',
        meta.contractValue || meta.contractPeriod || has('facility', 'plafond', 'tenor')
          ? 'ok'
          : 'bad',
        meta.contractValue || meta.contractPeriod
          ? 'Nilai / tenor teridentifikasi.'
          : 'Facility amount atau tenor belum terdeteksi.',
      ),
      alert(
        'Security / collateral',
        has('collateral', 'agunan', 'security', 'jaminan')
          ? has('to be agreed', 'akan disepakati', 'tbd')
            ? 'warn'
            : 'ok'
          : 'warn',
        has('to be agreed', 'akan disepakati')
          ? 'Agunan disebut belum final — perlu ditutup sebelum signing.'
          : has('collateral', 'agunan', 'jaminan')
            ? 'Security/collateral terdeteksi.'
            : 'Security/collateral belum jelas di teks.',
      ),
      alert(
        'Covenant & reporting',
        has('covenant', 'reporting', 'laporan keuangan', 'financial') ? 'ok' : 'warn',
        has('covenant', 'reporting', 'laporan')
          ? 'Covenant / reporting terdeteksi.'
          : 'Financial covenant & reporting belum jelas.',
      ),
      alert(
        'Event of default',
        has('event of default', 'wanprestasi', 'default') ? 'ok' : 'warn',
        has('event of default', 'wanprestasi', 'default')
          ? 'Event of default terdeteksi.'
          : 'EoD / cure period belum terdeteksi jelas.',
      ),
    ]
  }

  // Customer (default)
  return [
    alert(
      'Validity / Term',
      meta.contractPeriod || has('masa berlaku', 'jangka waktu', 'auto-renewal', 'perpanjangan')
        ? 'ok'
        : 'bad',
      meta.contractPeriod || has('masa berlaku', 'jangka waktu')
        ? 'Periode / term terdeteksi.'
        : 'Validity/term wajib — belum terdeteksi.',
    ),
    alert(
      'Termination',
      has('termination', 'pengakhiran', 'notice')
        ? has('reasonable', 'sewaktu-waktu')
          ? 'warn'
          : 'ok'
        : 'bad',
      has('reasonable', 'sewaktu-waktu')
        ? 'Notice termination ambigu (“reasonable”) — guide minta minimal 30 hari tertulis.'
        : has('termination', 'pengakhiran', 'notice')
          ? 'Klausul termination terdeteksi.'
          : 'Klausul termination belum ditemukan.',
    ),
    alert(
      'Penalty / Late payment',
      meta.latePaymentPenalty || has('denda', 'late payment', '1.5%', 'keterlambatan')
        ? 'ok'
        : 'warn',
      meta.latePaymentPenalty || has('denda', 'late payment', 'keterlambatan')
        ? 'Penalty / late payment terdeteksi.'
        : 'Late payment penalty belum jelas.',
    ),
    alert(
      'Liability cap',
      has('liability cap', 'batas tanggung', 'limitation of liability', 'cap')
        ? 'ok'
        : 'bad',
      has('liability cap', 'batas tanggung', 'limitation of liability')
        ? 'Liability cap terdeteksi.'
        : 'Tidak ada liability cap — guide Customer mewajibkan cap (mis. ≤ 12 bulan fee).',
    ),
  ]
}

export function classifyGuidelineCategory(input: {
  fileName?: string
  docType?: string
  rawText?: string
  extracted?: Record<string, string | undefined>
}): GuidelineCategory {
  const blob = [
    input.fileName,
    input.docType,
    input.rawText,
    ...(input.extracted ? Object.values(input.extracted) : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (/\b(loan|facility|kredit|pembiayaan|bank)\b/.test(blob)) return 'Loan'
  if (/\b(vendor|supplier|pengadaan|procurement|supply)\b/.test(blob)) return 'Vendor'
  if (/\b(customer|msa|colocation|sla|client|pelanggan)\b/.test(blob)) return 'Customer'
  return 'Customer'
}

export function summarizeGuidelineAlerts(alerts: GuidelineAlert[]): string {
  return alerts.map((a) => `${a.clause}: ${a.label}`).join('; ')
}
