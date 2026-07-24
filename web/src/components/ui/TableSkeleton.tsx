type Props = {
  rows?: number
  cols: number
}

export function TableSkeleton({ rows = 5, cols }: Props) {
  return (
    <>
      {Array.from({ length: rows }).map((_, ri) => (
        <tr key={ri} className="table-skeleton-row" aria-hidden>
          {Array.from({ length: cols }).map((__, ci) => (
            <td key={ci}>
              <span className="skeleton-line table-skeleton-cell" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
