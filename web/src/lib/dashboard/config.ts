import type { AppRole } from '@/types/cms'

export type KpiItem = {
  label: string
  value: string
  sub: string
  tone?: 'green' | 'amber' | 'red' | 'brass' | ''
}

export type PendingItem = {
  title: string
  sub: string
  href?: string
  pill?: string
  pillClass?: string
}

export type DashboardStats = {
  totalParties: number
  linkedParties: number
  pendingOdooLink: number
  mismatchOdooLink: number
  totalContracts: number
  draftContracts: number
  activeContracts: number
  reviewContracts: number
  autoRenewalContracts: number
}

export type LifecycleBreakdown = {
  active: number
  review: number
  draft: number
  other: number
  total: number
}

export type PicWorkloadRow = {
  pic: string
  count: number
}

export type RenewalTimelineRow = {
  party_id: string
  party_code: string
  contract_code: string
  renewal_date: string
  days_left: number
  bucket: 'urgent' | 'soon' | 'later'
}

export type SoHealthSnapshot = {
  synchronized: number
  noActiveSo: number
  inProgress: number
  syncErrors: number
}

export type DashboardPayload = {
  stats: DashboardStats
  lifecycle: LifecycleBreakdown
  picWorkload: PicWorkloadRow[]
  renewalTimeline: RenewalTimelineRow[]
  soHealth: SoHealthSnapshot
  noActiveSoParties: Array<{ id: string; party_code: string; name: string }>
  integration: { odooMode: string; ragflowMode: string }
  pendingOdooParties: Array<{ id: string; party_code: string; name: string; odoo_link_status: string }>
  recentContracts: Array<{
    id: string
    party_id: string
    contract_code: string
    status: string
    status_text: string
    party_code?: string
    party_name?: string
  }>
  renewalSoon: Array<{
    party_id: string
    party_code: string
    contract_code: string
    renewal_date: string
    days_left: number
  }>
  amendmentsReady: Array<{
    id: string
    party_id: string
    party_code: string
    amendment_code: string
    title: string
  }>
}

const DASHBOARD_COPY: Record<
  AppRole,
  { crumb: string; title: string; desc: string; notice: string }
> = {
  legal: {
    crumb: 'Legal Workspace',
    title: 'Contract Registry',
    desc: 'FR-DASH-003 · FR-DASH-005 — monitoring lifecycle & pending Legal actions (BRL-CMS-026 party-centric).',
    notice: 'Aksi create/edit kontrak & link Odoo tersedia. Party Detail = konteks utama kontrak.',
  },
  business: {
    crumb: 'Requestor View',
    title: 'My Contract Requests',
    desc: 'FR-DASH-003 — view-only; lacak status permintaan kontrak terkait unit Anda.',
    notice: 'Tidak ada CTA create di dashboard. Buka Parties untuk detail (FR-CNT-SV-004).',
  },
  finance: {
    crumb: 'Commercial Monitor',
    title: 'SO & Commercial Health',
    desc: 'FR-DASH-003 · INT-SO — monitor SO sync & commercial metadata (consume-only Odoo).',
    notice: 'Run Sync di SO Health, bukan menu terpisah (BRD §6.10).',
  },
  management: {
    crumb: 'Executive Oversight',
    title: 'Portfolio Overview',
    desc: 'FR-DASH-003 · FR-DASH-004 — view-only portfolio & renewal risk indicators.',
    notice: 'Oversight tanpa create/edit. Renewal detail di Renewal Calendar.',
  },
  it: {
    crumb: 'Integration Ops',
    title: 'Odoo & Integration Health',
    desc: 'FR-DASH-005 · INT-PTY · INT-SO — exception monitoring & adapter status.',
    notice: 'Run Sync di SO Health. Odoo Partner/SO consume-only (BR-CMS-020).',
  },
}

export function getDashboardCopy(role: AppRole) {
  return DASHBOARD_COPY[role]
}

export function buildKpisForRole(role: AppRole, data: DashboardPayload): KpiItem[] {
  const s = data.stats
  switch (role) {
    case 'legal':
      return [
        { label: 'Total Party', value: String(s.totalParties), sub: 'Supabase register', tone: '' },
        {
          label: 'Master Contracts',
          value: String(s.totalContracts),
          sub: `${s.draftContracts} draft · ${s.reviewContracts} review`,
          tone: 'brass',
        },
        {
          label: 'Active / Signed',
          value: pctContracts(s.activeContracts, s.totalContracts),
          sub: `${s.activeContracts} dari ${s.totalContracts}`,
          tone: 'green',
        },
        {
          label: 'Under Review',
          value: String(s.reviewContracts),
          sub: 'Perlu tindak lanjut Legal',
          tone: 'amber',
        },
        {
          label: 'Auto-Renewal',
          value: pctContracts(s.autoRenewalContracts, s.totalContracts),
          sub: `${s.autoRenewalContracts} kontrak · metadata`,
          tone: '',
        },
      ]
    case 'business':
      return [
        {
          label: 'Parties terlihat',
          value: String(s.totalParties),
          sub: 'Akses view-only',
          tone: 'brass',
        },
        {
          label: 'Draft kontrak',
          value: String(s.draftContracts),
          sub: 'Menunggu proses Legal',
          tone: 'amber',
        },
        {
          label: 'Under Review',
          value: String(s.reviewContracts),
          sub: 'Sedang direview Legal',
          tone: '',
        },
        {
          label: 'Aktif',
          value: String(s.activeContracts),
          sub: 'Fully Signed / Active',
          tone: 'green',
        },
      ]
    case 'finance': {
      const so = data.soHealth
      return [
        {
          label: 'SO Synchronized',
          value: String(so.synchronized),
          sub: pctContracts(so.synchronized, s.activeContracts),
          tone: 'green',
        },
        {
          label: 'No Active SO',
          value: String(so.noActiveSo),
          sub: 'NOTIF-CMS-014',
          tone: 'amber',
        },
        {
          label: 'In Progress',
          value: String(so.inProgress),
          sub: 'State sale',
          tone: 'brass',
        },
        {
          label: 'Sync Errors (7d)',
          value: String(so.syncErrors),
          sub: 'NOTIF-CMS-015',
          tone: 'red',
        },
      ]
    }
    case 'management':
      return [
        {
          label: 'Portfolio Parties',
          value: String(s.totalParties),
          sub: 'Party-centric register',
          tone: 'green',
        },
        {
          label: 'Active Contracts',
          value: String(s.activeContracts),
          sub: pct(s.activeContracts, s.totalContracts),
          tone: 'green',
        },
        {
          label: 'Renewal ≤30 hari',
          value: String(data.renewalSoon.filter((r) => r.days_left <= 30).length),
          sub: 'Urgent renewal bucket',
          tone: 'amber',
        },
        {
          label: 'Mismatch Odoo',
          value: String(s.mismatchOdooLink),
          sub: 'Resolusi Legal/IT',
          tone: 'red',
        },
      ]
    case 'it': {
      const so = data.soHealth
      return [
        {
          label: 'Odoo Linked',
          value: String(s.linkedParties),
          sub: pct(s.linkedParties, s.totalParties),
          tone: 'green',
        },
        {
          label: 'Pending / Mismatch',
          value: String(s.pendingOdooLink + s.mismatchOdooLink),
          sub: 'NOTIF-CMS-016/019',
          tone: 'amber',
        },
        {
          label: 'SO Sync Error',
          value: String(so.syncErrors),
          sub: '7 hari terakhir',
          tone: 'red',
        },
        {
          label: 'Adapter',
          value: data.integration.odooMode.toUpperCase(),
          sub: `RAGFlow ${data.integration.ragflowMode}`,
          tone: 'brass',
        },
      ]
    }
    default:
      return []
  }
}

export function buildPendingForRole(role: AppRole, data: DashboardPayload): PendingItem[] {
  const items: PendingItem[] = []

  for (const r of data.renewalSoon.filter((x) => x.days_left <= 14).slice(0, 2)) {
    items.push({
      title: `Renewal H-14 — ${r.party_code}`,
      sub: `${r.contract_code} · jatuh tempo ${r.renewal_date}`,
      href: `/parties/${r.party_id}`,
      pill: 'Urgent',
      pillClass: 'urgent',
    })
  }

  for (const a of data.amendmentsReady.slice(0, 2)) {
    items.push({
      title: `Ready for Signature — ${a.amendment_code}`,
      sub: `${a.party_code} · ${a.title}`,
      href: `/parties/${a.party_id}`,
      pill: 'Sign',
      pillClass: 'ready_sign',
    })
  }

  for (const p of data.pendingOdooParties.slice(0, 3)) {
    items.push({
      title: `Odoo Link — ${p.odoo_link_status}`,
      sub: `${p.party_code} · ${p.name}`,
      href: `/parties/${p.id}`,
    })
  }

  if (role === 'legal') {
    for (const c of data.recentContracts.filter((x) => x.status === 'draft').slice(0, 3)) {
      items.push({
        title: `Draft — ${c.contract_code}`,
        sub: `${c.party_code ?? 'Party'} · ${c.status_text}`,
        href: c.party_id ? `/parties/${c.party_id}` : undefined,
        pill: 'Draft',
        pillClass: 'draft',
      })
    }
  }

  if (role === 'finance') {
    for (const p of data.noActiveSoParties.slice(0, 3)) {
      items.push({
        title: p.party_code,
        sub: 'No Active SO / Renewal Not Found',
        href: `/parties/${p.id}`,
        pill: 'No SO',
        pillClass: 'pending',
      })
    }
  }

  if (role === 'it') {
    items.push({
      title: 'SO Health monitor',
      sub: 'Run Sync & exception list · INT-SO',
      href: '/so',
    })
  }

  if (role === 'management') {
    items.push({
      title: 'Renewal Calendar',
      sub: 'FR-DASH-004 · agenda renewal/expiry',
      href: '/renewal',
    })
  }

  return items.slice(0, 5)
}

function pct(n: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((n / total) * 100)}% parties`
}

function pctContracts(n: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((n / total) * 100)}%`
}
