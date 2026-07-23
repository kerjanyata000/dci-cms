import type { ContractMetadata } from '../../types/cms'

/** Best-effort field extraction from parsed document text (POC — refine with RAGFlow agent later). */
export function extractContractFieldsFromText(text: string): ContractMetadata {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const joined = lines.join('\n')

  const pick = (patterns: RegExp[]) => {
    for (const re of patterns) {
      const m = joined.match(re)
      if (m?.[1]?.trim()) return m[1].trim()
    }
    return undefined
  }

  const npwp = pick([
    /NPWP\s*[:：]?\s*([0-9.\-]{10,20})/i,
    /VAT\s*[:：]?\s*([0-9.\-]{10,20})/i,
  ])

  const counterpartyName = pick([
    /(?:PIHAK\s+KEDUA|COUNTERPARTY|NAMA\s+PERUSAHAAN)\s*[:：]?\s*(.+)/i,
    /(?:PT|CV)\s+[A-Za-z0-9 .,&-]{3,80}/,
  ])

  const agreementNo = pick([
    /(?:NOMOR\s+PERJANJIAN|NO\.?\s*KONTRAK|AGREEMENT\s+NO)\s*[:：]?\s*([A-Za-z0-9/.\-]+)/i,
  ])

  const contractPeriod = pick([
    /(?:MASA\s+BERLAKU|JANGKA\s+WAKTU|CONTRACT\s+PERIOD)\s*[:：]?\s*(.{3,80})/i,
  ])

  const contractValue = pick([
    /(?:NILAI\s+KONTRAK|CONTRACT\s+VALUE)\s*[:：]?\s*(.{3,80})/i,
    /IDR\s+[0-9.,]+/i,
  ])

  const autoRenewal = pick([
    /(?:AUTO[- ]?RENEWAL|PERPANJANGAN\s+OTOMATIS)\s*[:：]?\s*(.{2,40})/i,
  ])

  const earlyTerminationFee = pick([
    /(?:EARLY\s+TERMINATION|BIAYA\s+PENGAKHIRAN\s+DI\s+AWAL)\s*[:：]?\s*(.{3,120})/i,
  ])

  return {
    counterpartyName,
    agreementNo,
    contractPeriod,
    contractValue,
    npwp,
    autoRenewal,
    earlyTerminationFee,
    address: lines.find((l) => /jalan|jl\.|street|address/i.test(l))?.slice(0, 120),
  }
}
