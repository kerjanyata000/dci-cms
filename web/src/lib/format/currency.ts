export function formatCurrency(
  amount: number | null | undefined,
  currency = 'IDR',
): string {
  if (amount == null || Number.isNaN(amount)) return '—'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'IDR' ? 0 : 2,
  }).format(amount)
}
