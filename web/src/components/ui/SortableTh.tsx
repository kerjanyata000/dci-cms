type Props = {
  label: string
  sortKey: string
  activeKey: string
  dir: 'asc' | 'desc'
  onSort: (key: string) => void
}

export function SortableTh({ label, sortKey, activeKey, dir, onSort }: Props) {
  const active = activeKey === sortKey
  const indicator = active ? (dir === 'asc' ? ' ↑' : ' ↓') : ''
  return (
    <th>
      <button
        type="button"
        className={`sortable-th${active ? ' active' : ''}`}
        onClick={() => onSort(sortKey)}
      >
        {label}
        {indicator}
      </button>
    </th>
  )
}
