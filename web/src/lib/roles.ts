export type AppRole = 'legal' | 'business' | 'finance' | 'management' | 'it'

export type RoleConfig = {
  label: string
  initials: string
  /** Sidebar primary nav */
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
    nav: ['dashboard', 'parties', 'search', 'renewal'],
    views: ['dashboard', 'parties', 'party-detail', 'renewal', 'so', 'audit', 'notifications', 'search'],
    canEdit: true,
    canSync: true,
  },
  business: {
    label: 'Business User / Requestor',
    initials: 'BU',
    nav: ['dashboard', 'parties', 'search'],
    views: ['dashboard', 'parties', 'party-detail', 'notifications', 'search'],
    canEdit: false,
    canSync: false,
  },
  finance: {
    label: 'Finance / Commercial',
    initials: 'FC',
    nav: ['dashboard', 'parties', 'search', 'so'],
    views: ['dashboard', 'parties', 'party-detail', 'so', 'notifications', 'search'],
    canEdit: false,
    canSync: false,
  },
  management: {
    label: 'Management / Directors',
    initials: 'MD',
    nav: ['dashboard', 'parties', 'search', 'renewal'],
    views: ['dashboard', 'parties', 'party-detail', 'renewal', 'audit', 'notifications', 'search'],
    canEdit: false,
    canSync: false,
  },
  it: {
    label: 'IT / Odoo Support',
    initials: 'IT',
    nav: ['dashboard', 'parties', 'search', 'renewal', 'so'],
    views: ['dashboard', 'parties', 'party-detail', 'renewal', 'so', 'audit', 'notifications', 'search'],
    canEdit: false,
    canSync: true,
  },
}

export type SessionUser = {
  name: string
  role: AppRole
}
