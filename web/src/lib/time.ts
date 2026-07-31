/**
 * Semua tanggal operasional CMS memakai zona waktu WIB (GMT+7), terlepas dari
 * zona waktu server (biasanya UTC) atau perangkat pengguna. Tanpa ini, "hari ini"
 * di server UTC masih tanggal sebelumnya sampai jam 07:00 WIB.
 */
export const APP_TIME_ZONE = 'Asia/Jakarta'
export const APP_TIME_ZONE_LABEL = 'WIB (GMT+7)'

const DATE_PARTS = new Intl.DateTimeFormat('en-GB', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** Tanggal (YYYY-MM-DD) dari sebuah instant, dibaca pada jam dinding WIB. */
export function isoDateInAppZone(instant: Date = new Date()): string {
  const parts = DATE_PARTS.formatToParts(instant)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

/** Tanggal hari ini menurut WIB. */
export function todayIso(): string {
  return isoDateInAppZone()
}

/**
 * Tanggal (YYYY-MM-DD) dari komponen kalender sebuah Date — tanpa konversi zona
 * waktu. Dipakai untuk Date yang dibangun dari angka tahun/bulan/hari, mis. sel
 * grid kalender, karena `toISOString()` akan menggeser tanggal di GMT+7.
 */
export function calendarDateIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Selisih hari kalender antar dua tanggal YYYY-MM-DD (bebas efek zona waktu & DST). */
export function diffCalendarDays(fromIso: string, toIso: string): number {
  const from = Date.parse(`${fromIso}T00:00:00Z`)
  const to = Date.parse(`${toIso}T00:00:00Z`)
  if (Number.isNaN(from) || Number.isNaN(to)) return 0
  return Math.round((to - from) / 86400000)
}

/** Bulan (YYYY-MM) dari tanggal YYYY-MM-DD. */
export function isoMonth(isoDate: string): string {
  return isoDate.slice(0, 7)
}
