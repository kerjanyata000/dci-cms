import type { AppRole } from '@/types/cms'

export type KpiIconName =
  | 'parties'
  | 'contracts'
  | 'active'
  | 'review'
  | 'renewal'
  | 'sync'
  | 'quote'
  | 'alert'
  | 'link'
  | 'audit'
  | 'sign'
  | 'draft'
  | 'calendar'

export type KpiItem = {
  label: string
  value: string
  sub: string
  tone?: 'green' | 'amber' | 'red' | 'brass' | ''
  icon?: KpiIconName
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
  quotations: number
  syncErrors: number
}

export type CommercialBar = {
  label: string
  filled: number
  total: number
  tone: 'green' | 'brass' | 'amber'
}

export type DashboardPayload = {
  stats: DashboardStats
  lifecycle: LifecycleBreakdown
  picWorkload: PicWorkloadRow[]
  renewalTimeline: RenewalTimelineRow[]
  soHealth: SoHealthSnapshot
  commercialBars: CommercialBar[]
  auditEventCount: number
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
  { crumb: string; titlePrefix: string; desc: string; notice: string }
> = {
  legal: {
    crumb: 'Home · Legal Workspace',
    titlePrefix: 'Contract Registry',
    desc: 'Dashboard monitoring & pending Legal actions.',
    notice:
      'Alur utama: Dashboard → Parties → Renewal. SO Health & Activity Log lewat menu profil / sidebar.',
  },
  finance: {
    crumb: 'Home · Finance / Commercial',
    titlePrefix: 'Commercial Reference',
    desc: 'SO Health & referensi komersial — quotation Odoo ≠ Active SO / invoice.',
    notice:
      'Menu utama: SO Health. Quotation (draft/sent) terlihat sebagai referensi; Active SO = sale/done. CMS tidak posting ke Accounting.',
  },
  management: {
    crumb: 'Home · Executive Monitor',
    titlePrefix: 'Executive Overview',
    desc: 'Monitoring portfolio & renewal — view-only.',
    notice:
      'Menu utama: Renewal Calendar + Activity Log. Tidak ada create/edit kontrak.',
  },
  business: {
    crumb: 'Home · Business Requestor',
    titlePrefix: 'Portal Requestor',
    desc: 'Status permintaan & visibility party/kontrak (view-only).',
    notice:
      'Tanpa menu SO/Renewal admin. Create/edit hanya Legal. Ajukan kebutuhan ke Legal di luar CMS bila perlu.',
  },
  it: {
    crumb: 'Home · IT / Integration',
    titlePrefix: 'Integration Health',
    desc: 'Dukungan integrasi Odoo, Access Rights, dan technical support.',
    notice:
      'SO Health & Renewal Calendar di sidebar. Run Sync di SO Health — bukan di dashboard.',
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
        {
          label: 'Total Party',
          value: String(s.totalParties),
          sub: 'Register party',
          tone: '',
          icon: 'parties',
        },
        {
          label: 'Master Contracts',
          value: String(s.totalContracts),
          sub: `${s.draftContracts} draft · ${s.reviewContracts} review`,
          tone: 'brass',
          icon: 'contracts',
        },
        {
          label: 'Active / Signed',
          value: pctContracts(s.activeContracts, s.totalContracts),
          sub: `${s.activeContracts} dari ${s.totalContracts}`,
          tone: 'green',
          icon: 'active',
        },
        {
          label: 'Under Review',
          value: String(s.reviewContracts),
          sub: 'Perlu tindak lanjut Legal',
          tone: 'amber',
          icon: 'review',
        },
        {
          label: 'Auto-Renewal',
          value: pctContracts(s.autoRenewalContracts, s.totalContracts),
          sub: `${s.autoRenewalContracts} kontrak · metadata`,
          tone: '',
          icon: 'renewal',
        },
      ]
    case 'business':
      return [
        {
          label: 'Parties terlihat',
          value: String(s.totalParties),
          sub: 'Akses view-only',
          tone: 'brass',
          icon: 'parties',
        },
        {
          label: 'Draft kontrak',
          value: String(s.draftContracts),
          sub: 'Menunggu proses Legal',
          tone: 'amber',
          icon: 'draft',
        },
        {
          label: 'Under Review',
          value: String(s.reviewContracts),
          sub: 'Sedang direview Legal',
          tone: '',
          icon: 'review',
        },
        {
          label: 'Aktif',
          value: String(s.activeContracts),
          sub: 'Fully Signed / Active',
          tone: 'green',
          icon: 'active',
        },
      ]
    case 'finance': {
      const so = data.soHealth
      return [
        {
          label: 'SO Synchronized',
          value: String(so.synchronized),
          sub: 'Party aktif + sale/done',
          tone: 'green',
          icon: 'sync',
        },
        {
          label: 'Quotations',
          value: String(so.quotations ?? 0),
          sub: 'draft/sent · belum Active SO',
          tone: 'brass',
          icon: 'quote',
        },
        {
          label: 'No Active SO',
          value: String(so.noActiveSo),
          sub: 'Perlu tindak lanjut',
          tone: 'amber',
          icon: 'alert',
        },
        {
          label: 'Sync Errors (7d)',
          value: String(so.syncErrors),
          sub: 'Error sync',
          tone: 'red',
          icon: 'alert',
        },
      ]
    }
    case 'management': {
      const urgent = data.renewalSoon.filter((r) => r.days_left <= 30).length
      const soon = data.renewalSoon.filter((r) => r.days_left > 30 && r.days_left <= 180).length
      return [
        {
          label: 'Portfolio Active',
          value: pctContracts(s.activeContracts, s.totalContracts),
          sub: 'Fully Signed / Active',
          tone: 'green',
          icon: 'active',
        },
        {
          label: 'Renewal ≤30 hari',
          value: String(urgent),
          sub: 'Urgent bucket',
          tone: 'red',
          icon: 'calendar',
        },
        {
          label: 'Renewal 31–180 hari',
          value: String(soon),
          sub: 'Segera',
          tone: 'amber',
          icon: 'renewal',
        },
        {
          label: 'Audit events',
          value: String(data.auditEventCount),
          sub: 'Activity Log',
          tone: '',
          icon: 'audit',
        },
      ]
    }
    case 'it': {
      const so = data.soHealth
      return [
        {
          label: 'Odoo Linked',
          value: String(s.linkedParties),
          sub: pct(s.linkedParties, s.totalParties),
          tone: 'green',
          icon: 'link',
        },
        {
          label: 'Pending / Mismatch',
          value: String(s.pendingOdooLink + s.mismatchOdooLink),
          sub: 'Perlu review link',
          tone: 'amber',
          icon: 'alert',
        },
        {
          label: 'SO Sync Error',
          value: String(so.syncErrors),
          sub: '7 hari terakhir',
          tone: 'red',
          icon: 'sync',
        },
        {
          label: 'Koneksi Odoo',
          value: data.integration.odooMode.toUpperCase(),
          sub: `Ekstraksi ${data.integration.ragflowMode}`,
          tone: 'brass',
          icon: 'link',
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
        pillClass: 'no_so',
      })
    }
  }

  if (role === 'it') {
    items.push({
      title: 'SO Health monitor',
      sub: 'Run Sync & exception list',
      href: '/so',
    })
  }

  if (role === 'management') {
    items.push({
      title: 'Renewal Calendar',
      sub: 'Agenda renewal / expiry',
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
