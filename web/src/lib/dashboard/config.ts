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
}

export type DashboardPayload = {
  stats: DashboardStats
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
          value: String(s.activeContracts),
          sub: 'status active/signed',
          tone: 'green',
        },
        {
          label: 'Under Review',
          value: String(s.reviewContracts),
          sub: 'Perlu tindak lanjut Legal',
          tone: 'amber',
        },
        {
          label: 'Odoo Linked',
          value: String(s.linkedParties),
          sub: `${s.pendingOdooLink} pending · ${s.mismatchOdooLink} mismatch`,
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
    case 'finance':
      return [
        {
          label: 'Odoo Linked',
          value: String(s.linkedParties),
          sub: `${s.totalParties} parties total`,
          tone: 'green',
        },
        {
          label: 'Pending Odoo Link',
          value: String(s.pendingOdooLink),
          sub: 'Perlu follow-up link',
          tone: 'amber',
        },
        {
          label: 'Mismatch / Relink',
          value: String(s.mismatchOdooLink),
          sub: 'NOTIF-CMS-016 path',
          tone: 'red',
        },
        {
          label: 'Kontrak aktif',
          value: String(s.activeContracts),
          sub: 'Commercial reference',
          tone: 'brass',
        },
      ]
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
          sub: `dari ${s.totalContracts} total`,
          tone: 'green',
        },
        {
          label: 'Pending Odoo',
          value: String(s.pendingOdooLink),
          sub: 'Integration gap',
          tone: 'amber',
        },
        {
          label: 'Mismatch',
          value: String(s.mismatchOdooLink),
          sub: 'Resolusi Legal/IT',
          tone: 'red',
        },
      ]
    case 'it':
      return [
        {
          label: 'Odoo Linked',
          value: String(s.linkedParties),
          sub: pct(s.linkedParties, s.totalParties),
          tone: 'green',
        },
        {
          label: 'Pending / Unlinked',
          value: String(s.pendingOdooLink),
          sub: 'NOTIF-CMS-019',
          tone: 'amber',
        },
        {
          label: 'Mismatch / Relink',
          value: String(s.mismatchOdooLink),
          sub: 'NOTIF-CMS-016',
          tone: 'red',
        },
        {
          label: 'Contracts',
          value: String(s.totalContracts),
          sub: 'CMS records',
          tone: 'brass',
        },
      ]
    default:
      return []
  }
}

export function buildPendingForRole(role: AppRole, data: DashboardPayload): PendingItem[] {
  const items: PendingItem[] = []

  for (const p of data.pendingOdooParties.slice(0, 4)) {
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

  if (role === 'it' || role === 'finance') {
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
