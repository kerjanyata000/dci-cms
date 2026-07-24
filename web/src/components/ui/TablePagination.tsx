'use client'

type Props = {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  /** e.g. "Party", "Baris", "SO" */
  itemLabel?: string
}

export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  itemLabel = 'Baris',
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1
  const end = Math.min(safePage * pageSize, total)

  const label =
    total === 0
      ? 'Tidak ada hasil'
      : `${itemLabel} ${start}–${end} dari ${total}`

  if (totalPages <= 1 && total === 0) {
    return (
      <div className="pagination">
        <span>{label}</span>
      </div>
    )
  }

  return (
    <div className="pagination">
      <span>{label}</span>
      {totalPages > 1 && (
        <div className="page-btns">
          <button
            type="button"
            aria-label="Halaman sebelumnya"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              className={n === safePage ? 'active' : ''}
              onClick={() => onPageChange(n)}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            aria-label="Halaman berikutnya"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
          >
            ›
          </button>
        </div>
      )}
    </div>
  )
}

export function paginateSlice<T>(items: T[], page: number, pageSize: number): T[] {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  return items.slice(start, start + pageSize)
}
