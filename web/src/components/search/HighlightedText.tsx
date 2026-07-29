'use client'

import { searchTermsFromQuery } from '@/lib/ragflow/text'

type Props = {
  text: string
  query: string
  className?: string
}

/** Highlight kata kunci pencarian di dalam teks (case-insensitive). */
export function HighlightedText({ text, query, className }: Props) {
  const terms = searchTermsFromQuery(query)
    .slice()
    .sort((a, b) => b.length - a.length)

  if (!text || terms.length === 0) {
    return <span className={className}>{text}</span>
  }

  const pattern = new RegExp(`(${terms.map((t) => escapeRegExp(t)).join('|')})`, 'gi')
  const parts = text.split(pattern)

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (!part) return null
        const isHit = terms.some((t) => t.toLowerCase() === part.toLowerCase())
        if (isHit) {
          return (
            <mark key={`${i}-${part}`} className="search-hit-mark">
              {part}
            </mark>
          )
        }
        return <span key={`${i}-${part}`}>{part}</span>
      })}
    </span>
  )
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
