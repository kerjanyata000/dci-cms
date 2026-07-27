export type AppRole = 'legal' | 'business' | 'finance' | 'management' | 'it'

export type RoleConfig = {
  label: string
  initials: string
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
    nav: ['dashboard', 'parties', 'search', 'renewal'],
    views: ['dashboard', 'parties', 'party-detail', 'renewal', 'so', 'audit', 'notifications', 'search'],
    canEdit: true,
    canSync: true,
  },
  business: {
    label: 'Business User / Requestor',
    initials: 'BU',
    defaultName: 'Business Requestor',
    nav: ['dashboard', 'parties', 'search'],
    views: ['dashboard', 'parties', 'party-detail', 'notifications', 'search'],
    canEdit: false,
    canSync: false,
  },
  finance: {
    label: 'Finance / Commercial',
    initials: 'FC',
    defaultName: 'Finance Commercial',
    nav: ['dashboard', 'so', 'parties', 'search'],
    views: ['dashboard', 'parties', 'party-detail', 'so', 'notifications', 'search'],
    canEdit: false,
    canSync: false,
  },
  management: {
    label: 'Management / Directors',
    initials: 'MD',
    defaultName: 'Management Director',
    nav: ['dashboard', 'renewal', 'parties', 'search'],
    views: ['dashboard', 'parties', 'party-detail', 'renewal', 'audit', 'notifications', 'search'],
    canEdit: false,
    canSync: false,
  },
  it: {
    label: 'IT / Odoo Support',
    initials: 'IT',
    defaultName: 'IT Support',
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
