import type { AppRole } from '@/lib/roles'

/** UAT demo accounts — create via `npm run seed:auth` (passwords only in seed script). */
export const DEMO_AUTH_ACCOUNTS: Array<{
  email: string
  role: AppRole
  full_name: string
}> = [
  { email: 'legal.admin@dci.co.id', role: 'legal', full_name: 'Legal Admin' },
  { email: 'business.user@dci.co.id', role: 'business', full_name: 'Business User' },
  { email: 'finance.user@dci.co.id', role: 'finance', full_name: 'Finance User' },
  { email: 'mgmt.user@dci.co.id', role: 'management', full_name: 'Management User' },
  { email: 'it.ops@dci.co.id', role: 'it', full_name: 'IT Ops' },
]
