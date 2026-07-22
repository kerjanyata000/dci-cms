export type AppRole = 'legal' | 'business' | 'finance' | 'management' | 'it'

export type RoleConfig = {
  label: string
  initials: string
  /** Sidebar primary nav */
  nav: Array<'dashboard' | 'parties' | 'renewal' | 'so'>
  views: Array<
    'dashboard' | 'parties' | 'party-detail' | 'renewal' | 'so' | 'audit' | 'notifications'
  >
  canEdit: boolean
  canSync: boolean
}

export const ROLES: Record<AppRole, RoleConfig> = {
  legal: {
    label: 'Legal / Contract Admin',
    initials: 'LG',
    nav: ['dashboard', 'parties', 'renewal'],
    views: ['dashboard', 'parties', 'party-detail', 'renewal', 'so', 'audit', 'notifications'],
    canEdit: true,
    canSync: true,
  },
  business: {
    label: 'Business User / Requestor',
    initials: 'BU',
    nav: ['dashboard', 'parties'],
    views: ['dashboard', 'parties', 'party-detail', 'notifications'],
    canEdit: false,
    canSync: false,
  },
  finance: {
    label: 'Finance / Commercial',
    initials: 'FC',
    nav: ['dashboard', 'parties', 'so'],
    views: ['dashboard', 'parties', 'party-detail', 'so', 'notifications'],
    canEdit: false,
    canSync: false,
  },
  management: {
    label: 'Management / Directors',
    initials: 'MD',
    nav: ['dashboard', 'parties', 'renewal'],
    views: ['dashboard', 'parties', 'party-detail', 'renewal', 'audit', 'notifications'],
    canEdit: false,
    canSync: false,
  },
  it: {
    label: 'IT / Odoo Support',
    initials: 'IT',
    nav: ['dashboard', 'parties', 'renewal', 'so'],
    views: ['dashboard', 'parties', 'party-detail', 'renewal', 'so', 'audit', 'notifications'],
    canEdit: false,
    canSync: true,
  },
}

export type SessionUser = {
  name: string
  role: AppRole
}
