/** Plain-text preview from RAGFlow chunk (often HTML tables from parsed PDFs). */
export function stripHtmlForDisplay(raw: string, maxLen = 480): string {
  let text = flattenHtml(raw)

  if (text.length > maxLen) {
    text = `${text.slice(0, maxLen).trim()}…`
  }
  return text
}

function flattenHtml(raw: string): string {
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/td>/gi, ' ')
    .replace(/<\/th>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Token kata kunci (panjang ≥ 2), frasa utuh di depan. */
export function searchTermsFromQuery(query: string): string[] {
  const q = query.trim()
  if (!q) return []
  const words = q.split(/\s+/).filter((w) => w.length >= 2)
  const terms: string[] = []
  if (q.length >= 2) terms.push(q)
  for (const w of words) {
    if (!terms.some((t) => t.toLowerCase() === w.toLowerCase())) terms.push(w)
  }
  return terms
}

function findBestMatchIndex(text: string, terms: string[]): { index: number; length: number } | null {
  const lower = text.toLowerCase()
  let best: { index: number; length: number } | null = null
  for (const term of terms) {
    const idx = lower.indexOf(term.toLowerCase())
    if (idx < 0) continue
    if (!best || term.length > best.length || (term.length === best.length && idx < best.index)) {
      best = { index: idx, length: term.length }
    }
  }
  return best
}

export type SearchSnippet = {
  text: string
  matched: boolean
}

/**
 * Potongan teks yang memuat kata kunci (bukan selalu dari awal chunk),
 * agar highlight & kutipan relevan untuk smart search.
 */
export function buildSearchSnippet(raw: string, query: string, maxLen = 280): SearchSnippet {
  const text = flattenHtml(raw)
  if (!text) return { text: '', matched: false }

  const terms = searchTermsFromQuery(query)
  const match = findBestMatchIndex(text, terms)

  if (!match) {
    const head = text.length > maxLen ? `${text.slice(0, maxLen).trim()}…` : text
    return { text: head, matched: false }
  }

  const pad = Math.floor((maxLen - match.length) / 2)
  let start = Math.max(0, match.index - pad)
  let end = Math.min(text.length, match.index + match.length + pad)

  if (end - start < maxLen) {
    end = Math.min(text.length, start + maxLen)
    start = Math.max(0, end - maxLen)
  }

  // Snap ke batas spasi agar tidak potong kata di tengah
  if (start > 0) {
    const space = text.indexOf(' ', start)
    if (space > start && space < start + 40) start = space + 1
  }
  if (end < text.length) {
    const space = text.lastIndexOf(' ', end)
    if (space > end - 40 && space > start) end = space
  }

  const slice = text.slice(start, end).trim()
  const prefix = start > 0 ? '…' : ''
  const suffix = end < text.length ? '…' : ''
  return { text: `${prefix}${slice}${suffix}`, matched: true }
}
