/**
 * Create UAT demo users in Supabase Auth + profiles.role
 * Usage (from web/): npm run seed:auth
 * Requires SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL in .env.local
 *
 * Passwords are demo-only — rotate before go-live.
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')

function loadEnv() {
  if (!existsSync(envPath)) {
    console.error(`Missing ${envPath}`)
    process.exit(1)
  }
  const raw = readFileSync(envPath, 'utf8')
  const env = {}
  for (const line of raw.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 0) continue
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
  }
  return env
}

const env = loadEnv()
const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

/** Keep in sync with web/src/lib/auth/demo-accounts.ts */
const DEMO_USERS = [
  { email: 'legal.admin@dci.co.id', password: 'DemoLegal123!', role: 'legal', full_name: 'Legal Admin' },
  { email: 'business.user@dci.co.id', password: 'DemoBusiness123!', role: 'business', full_name: 'Business User' },
  { email: 'finance.user@dci.co.id', password: 'DemoFinance123!', role: 'finance', full_name: 'Finance User' },
  { email: 'mgmt.user@dci.co.id', password: 'DemoMgmt123!', role: 'management', full_name: 'Management User' },
  { email: 'it.ops@dci.co.id', password: 'DemoIt123!', role: 'it', full_name: 'IT Ops' },
]

async function main() {
  console.log('Seeding Supabase Auth demo users (profiles via trigger 006 + upsert)…\n')

  for (const u of DEMO_USERS) {
    const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const existing = list?.users?.find((x) => x.email?.toLowerCase() === u.email.toLowerCase())

    let userId = existing?.id

    if (existing) {
      const { error: pwErr } = await db.auth.admin.updateUserById(existing.id, {
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.full_name, role: u.role },
      })
      if (pwErr) {
        console.error(`Update failed ${u.email}:`, pwErr.message)
        process.exit(1)
      }
      console.log(`• ${u.email} — exists, password/metadata refreshed (${u.role})`)
    } else {
      const { data, error } = await db.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.full_name, role: u.role },
      })
      if (error) {
        console.error(`Failed ${u.email}:`, error.message)
        process.exit(1)
      }
      userId = data.user?.id
      console.log(`✓ ${u.email} — created (${u.role})`)
    }

    if (userId) {
      const { error: profileErr } = await db.from('profiles').upsert(
        { id: userId, full_name: u.full_name, role: u.role, updated_at: new Date().toISOString() },
        { onConflict: 'id' },
      )
      if (profileErr) {
        console.error(`Profile upsert failed for ${u.email}:`, profileErr.message)
        process.exit(1)
      }
    }
  }

  console.log('\nDone. Auth mode (S4 / FR-DASH-001):')
  console.log('  Default is supabase when URL+anon key are set.')
  console.log('  Opt-out prototype: NEXT_PUBLIC_AUTH_MODE=mock')
  console.log('\nLogin examples:')
  for (const u of DEMO_USERS) {
    console.log(`  ${u.role.padEnd(10)} ${u.email} / ${u.password}`)
  }
  console.log('\n⚠ Rotate passwords before real go-live.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
