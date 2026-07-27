export type AppRole = 'legal' | 'business' | 'finance' | 'management' | 'it'

export type RoleConfig = {
  label: string
  initials: string
  /** Short description for login role picker */
  desc: string
  /** One-line workspace focus shown in shell / profile */
  focus: string
  /** Display name used for mock login (no email) */
  defaultName: string
  /** Sidebar primary nav — order = priority for that role */
  nav: Array<'dashboard' | 'parties' | 'renewal' | 'so' | 'search'>
  views: Array<
    | 'dashboard'
    | 'parties'
    | 'party-detail'
    | 'renewal'
    | 'so'
    | 'audit'
    | 'notifications'
    | 'search'
  >
  canEdit: boolean
  canSync: boolean
}

export const ROLES: Record<AppRole, RoleConfig> = {
  legal: {
    label: 'Legal / Contract Admin',
    initials: 'LG',
    defaultName: 'Legal Admin',
    desc: 'Create/edit kontrak, CP change, amendment, termination, party CRUD.',
    focus: 'Registry penuh · create & lifecycle Legal',
    nav: ['dashboard', 'parties', 'search', 'renewal'],
    views: ['dashboard', 'parties', 'party-detail', 'renewal', 'so', 'audit', 'notifications', 'search'],
    canEdit: true,
    canSync: true,
  },
  business: {
    label: 'Business User / Requestor',
    initials: 'BU',
    defaultName: 'Business Requestor',
    desc: 'Lihat status permintaan & party terkait. Tidak create/edit kontrak.',
    focus: 'Status permintaan · view-only',
    nav: ['dashboard', 'parties', 'search'],
    views: ['dashboard', 'parties', 'party-detail', 'notifications', 'search'],
    canEdit: false,
    canSync: false,
  },
  finance: {
    label: 'Finance / Commercial',
    initials: 'FC',
    defaultName: 'Finance Commercial',
    desc: 'SO Health & referensi komersial. Quotation Odoo ≠ invoice Accounting.',
    focus: 'SO Health · referensi komersial',
    // SO first after dashboard — inti kerja Finance di CMS
    nav: ['dashboard', 'so', 'parties', 'search'],
    views: ['dashboard', 'parties', 'party-detail', 'so', 'notifications', 'search'],
    canEdit: false,
    canSync: false,
  },
  management: {
    label: 'Management / Directors',
    initials: 'MD',
    defaultName: 'Management Director',
    desc: 'Monitoring portfolio & renewal. View-only, Activity Log tersedia.',
    focus: 'Portfolio & renewal oversight',
    // Renewal first after dashboard — inti oversight
    nav: ['dashboard', 'renewal', 'parties', 'search'],
    views: ['dashboard', 'parties', 'party-detail', 'renewal', 'audit', 'notifications', 'search'],
    canEdit: false,
    canSync: false,
  },
  it: {
    label: 'IT / Odoo Support',
    initials: 'IT',
    defaultName: 'IT Support',
    desc: 'Integrasi Odoo, exception, SO Sync. Tanpa create kontrak.',
    focus: 'Integrasi Odoo · sync & exception',
    nav: ['dashboard', 'so', 'parties', 'renewal', 'search'],
    views: ['dashboard', 'parties', 'party-detail', 'renewal', 'so', 'audit', 'notifications', 'search'],
    canEdit: false,
    canSync: true,
  },
}

export type SessionUser = {
  name: string
  role: AppRole
}

export function accessModeLabel(role: AppRole): string {
  const cfg = ROLES[role]
  if (cfg.canEdit) return 'Edit · Legal-managed'
  if (cfg.canSync) return 'View-only · Sync diizinkan'
  return 'View-only'
}

/** Middleware / route guard — path must match RBAC nav + views (BRL-CMS-001). */
export function canAccessRoute(role: AppRole, pathname: string): boolean {
  const cfg = ROLES[role]

  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    return cfg.views.includes('dashboard')
  }
  if (pathname.startsWith('/parties')) {
    return cfg.views.includes('parties') || cfg.views.includes('party-detail')
  }
  if (pathname.startsWith('/renewal')) {
    return cfg.nav.includes('renewal') || cfg.views.includes('renewal')
  }
  if (pathname.startsWith('/so')) {
    return cfg.nav.includes('so') || cfg.views.includes('so')
  }
  if (pathname.startsWith('/search')) {
    return cfg.nav.includes('search')
  }
  if (pathname.startsWith('/activity')) {
    return cfg.views.includes('audit')
  }
  if (pathname.startsWith('/notifications')) {
    return cfg.views.includes('notifications')
  }
  if (pathname.startsWith('/lab')) {
    return role === 'legal' || role === 'it'
  }

  return false
}
