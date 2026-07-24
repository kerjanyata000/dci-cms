/**
 * UAT smoke test — checklist §11 (requires dev server on BASE_URL)
 * Usage: npm run dev (other terminal) then npm run smoke:uat
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000'

function loadEnv() {
  try {
    const raw = readFileSync(resolve(__dirname, '../.env.local'), 'utf8')
    const env = {}
    for (const line of raw.split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const i = t.indexOf('=')
      if (i < 0) continue
      env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
    }
    return env
  } catch {
    return {}
  }
}

const env = loadEnv()
const authMode = env.NEXT_PUBLIC_AUTH_MODE === 'supabase' ? 'supabase' : 'mock'

let passed = 0
let failed = 0

function ok(label) {
  passed += 1
  console.log(`  ✓ ${label}`)
}

function fail(label, detail) {
  failed += 1
  console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
}

async function getJson(path, init) {
  const res = await fetch(`${BASE}${path}`, init)
  const body = await res.json().catch(() => ({}))
  return { res, body }
}

async function getRoute(path, init) {
  return fetch(`${BASE}${path}`, { redirect: 'manual', ...init })
}

async function establishSession(role) {
  if (authMode === 'supabase') {
    fail('Session (supabase)', 'Set SMOKE_LEGAL_EMAIL/PASSWORD or use mock mode for automated smoke')
    return null
  }
  const { res, body } = await getJson('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: { name: 'Smoke Legal', role } }),
  })
  if (!res.ok || !body.ok) {
    fail(`Session POST (${role})`, body.error ?? res.status)
    return null
  }
  const cookie = res.headers.get('set-cookie')
  if (!cookie) {
    fail(`Session cookie (${role})`, 'missing Set-Cookie')
    return null
  }
  return cookie.split(';')[0]
}

async function main() {
  console.log(`\nCMS UAT Smoke — ${BASE} (auth: ${authMode})\n`)

  // Health (no auth)
  for (const path of ['/api/odoo/health', '/api/ragflow/health']) {
    try {
      const { res, body } = await getJson(path)
      if (res.ok && body.ok !== false && body.data?.ok !== false) ok(`${path}`)
      else fail(path, JSON.stringify(body).slice(0, 80))
    } catch (e) {
      fail(path, e instanceof Error ? e.message : 'fetch failed — is npm run dev running?')
    }
  }

  const legalCookie = await establishSession('legal')
  if (legalCookie) {
    const headers = { Cookie: legalCookie }
    for (const path of ['/api/parties', '/api/dashboard', '/api/renewal', '/api/notifications']) {
      const { res, body } = await getJson(path, { headers })
      if (res.ok && body.ok) ok(`${path} (Legal)`)
      else fail(path, body.error ?? res.status)
    }
    const audit = await getJson('/api/audit', { headers })
    if (audit.res.ok && audit.body.ok) ok('/api/audit (Legal)')
    else fail('/api/audit', audit.body.error ?? audit.res.status)
  }

  const bizCookie = await establishSession('business')
  if (bizCookie) {
    const headers = { Cookie: bizCookie }
    const parties = await getJson('/api/parties', { headers })
    if (parties.res.ok && parties.body.ok) ok('/api/parties (Business read)')
    else fail('/api/parties Business', parties.body.error)

    const write = await getJson('/api/parties', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Smoke Forbidden Party' }),
    })
    if (write.res.status === 403) ok('POST /api/parties → 403 (Business view-only)')
    else fail('POST /api/parties RBAC', `expected 403 got ${write.res.status}`)

    const audit = await getJson('/api/audit', { headers })
    if (audit.res.status === 403) ok('/api/audit → 403 (Business no audit)')
    else fail('/api/audit RBAC', `expected 403 got ${audit.res.status}`)

    const deniedRenewal = await getRoute('/renewal', { headers })
    const deniedLoc = deniedRenewal.headers.get('location') ?? ''
    if (
      (deniedRenewal.status === 307 || deniedRenewal.status === 302) &&
      deniedLoc.includes('/dashboard') &&
      deniedLoc.includes('forbidden=%2Frenewal')
    ) {
      ok('GET /renewal → redirect forbidden (Business)')
    } else {
      fail('GET /renewal RBAC', `status ${deniedRenewal.status} location ${deniedLoc}`)
    }
  }

  if (legalCookie) {
    const headers = { Cookie: legalCookie }
    const renewalPage = await getRoute('/renewal', { headers })
    if (renewalPage.status === 200) ok('GET /renewal → 200 (Legal)')
    else fail('GET /renewal Legal', `status ${renewalPage.status}`)

    const activityPage = await getRoute('/activity', { headers })
    if (activityPage.status === 200) ok('GET /activity → 200 (Legal)')
    else fail('GET /activity Legal', `status ${activityPage.status}`)
  }

  const unauth = await getRoute('/parties')
  const loginLoc = unauth.headers.get('location') ?? ''
  if (
    (unauth.status === 307 || unauth.status === 302) &&
    loginLoc.includes('next=%2Fparties')
  ) {
    ok('GET /parties tanpa session → redirect login')
  } else {
    fail('Unauthenticated route guard', `status ${unauth.status} location ${loginLoc}`)
  }

  console.log(`\nResult: ${passed} passed, ${failed} failed\n`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
