/**
 * Seed demo data from CMS_Mockup.html into Supabase.
 * Usage (from web/): npm run seed:demo
 * Force replace all CMS rows: npm run seed:demo -- --force
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')

function loadEnv() {
  const raw = readFileSync(envPath, 'utf8')
  const env = {}
  for (const line of raw.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 0) continue
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
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

const db = createClient(url, key, { auth: { persistSession: false } })

const PARTIES = [
  { id: 'a0000001-0001-4001-8001-000000000001', party_code: 'PTY-00001', name: 'Customer ABC', pic: 'Keshia', odoo_partner_id: 1001, odoo_link_status: 'linked' },
  { id: 'a0000001-0001-4001-8001-000000000002', party_code: 'PTY-00002', name: 'Party No. 002', pic: 'Ayu', odoo_partner_id: 1002, odoo_link_status: 'linked' },
  { id: 'a0000001-0001-4001-8001-000000000003', party_code: 'PTY-00003', name: 'Party No. 003', pic: 'Dewi', odoo_partner_id: null, odoo_link_status: 'pending' },
  { id: 'a0000001-0001-4001-8001-000000000006', party_code: 'PTY-00006', name: 'Party No. 006', pic: 'Keshia', odoo_partner_id: 1006, odoo_link_status: 'linked' },
  { id: 'a0000001-0001-4001-8001-000000000007', party_code: 'PTY-00007', name: 'Party No. 007', pic: 'Ayu', odoo_partner_id: 1007, odoo_link_status: 'linked' },
  { id: 'a0000001-0001-4001-8001-000000000009', party_code: 'PTY-00009', name: 'Party No. 009', pic: 'Itania', odoo_partner_id: 1009, odoo_link_status: 'linked' },
  { id: 'a0000001-0001-4001-8001-000000000013', party_code: 'PTY-00013', name: 'Party No. 013', pic: 'Verlando', odoo_partner_id: 1013, odoo_link_status: 'linked' },
  { id: 'a0000001-0001-4001-8001-000000000023', party_code: 'PTY-00023', name: 'Party No. 023', pic: 'Dewi', odoo_partner_id: 1023, odoo_link_status: 'linked' },
  { id: 'a0000001-0001-4001-8001-000000000025', party_code: 'PTY-00025', name: 'Party No. 025', pic: 'Dewi', odoo_partner_id: 1025, odoo_link_status: 'linked' },
  { id: 'a0000001-0001-4001-8001-0000000025b0', party_code: 'PTY-00025-B', name: 'Party No. 025-B (post-novation)', pic: 'Dewi', odoo_partner_id: 1025, odoo_link_status: 'linked' },
  { id: 'a0000001-0001-4001-8001-000000000041', party_code: 'PTY-00041', name: 'Party No. 041', pic: 'Dewi', odoo_partner_id: null, odoo_link_status: 'pending' },
  { id: 'a0000001-0001-4001-8001-000000000073', party_code: 'PTY-00073', name: 'Party No. 073', pic: 'Verlando', odoo_partner_id: 1073, odoo_link_status: 'linked' },
  { id: 'a0000001-0001-4001-8001-000000000079', party_code: 'PTY-00079', name: 'Party No. 079', pic: 'Jessie', odoo_partner_id: 1079, odoo_link_status: 'linked' },
  { id: 'a0000001-0001-4001-8001-000000000098', party_code: 'PTY-00098', name: 'Party No. 098', pic: 'Dewi', odoo_partner_id: 9998, odoo_link_status: 'mismatch' },
  { id: 'a0000001-0001-4001-8001-000000000228', party_code: 'PTY-00228', name: 'Party No. 228', pic: 'Verlando', odoo_partner_id: 1228, odoo_link_status: 'linked' },
  { id: 'a0000001-0001-4001-8001-000000000102', party_code: 'PTY-00102', name: 'Party No. 102', pic: 'Itania', odoo_partner_id: null, odoo_link_status: 'pending' },
]

const force = process.argv.includes('--force')

async function wipeDemoTables() {
  const order = [
    'audit_logs',
    'documents',
    'contract_amendments',
    'contract_terminations',
    'contract_counterparty_changes',
    'sale_orders',
    'contracts',
    'parties',
  ]
  for (const table of order) {
    const { error } = await db.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) {
      console.error(`Wipe failed on ${table}:`, error.message)
      process.exit(1)
    }
  }
  console.log('Cleared existing CMS demo tables')
}

async function main() {
  const { data: existing } = await db.from('parties').select('id').eq('party_code', 'PTY-00001').maybeSingle()
  if (existing && !force) {
    const { count } = await db.from('parties').select('*', { count: 'exact', head: true })
    if ((count ?? 0) >= 10) {
      console.log('Demo seed skipped — mockup data already present (use --force to replace)')
      return
    }
    console.log('Partial data detected — continuing seed for missing rows')
  } else if (force) {
    await wipeDemoTables()
  } else if (existing) {
    console.log('Demo seed skipped — PTY-00001 already exists (use --force to replace)')
    return
  }

  const steps = [
    ['parties', PARTIES.map((p) => ({ ...p, party_status: 'Active' }))],
    ['contracts', [
      { id: 'b0000001-0001-4001-8001-201800000001', party_id: 'a0000001-0001-4001-8001-000000000001', original_party_id: 'a0000001-0001-4001-8001-000000000001', contract_code: 'CMS-2018-00001', contract_title: 'Master Services Agreement', doc_type: 'MSA', agreement_no: 'ABC/2021/ABC', agreement_date: '2018-12-17', duration_months: 60, renewal_date: '2026-07-21', expiry_date: '2023-12-17', owner: 'Keshia', department: 'Legal', status: 'active', status_text: 'Active', validation_status: 'ok', extracted_metadata: {}, confirmed_metadata: { counterpartyName: 'Customer ABC', agreementNo: 'ABC/2021/ABC', contractValue: 'USD XXX,XXX,XXX.00', paymentTerm: '45 hari', autoRenewal: 'Ya' } },
      { id: 'b0000001-0001-4001-8001-202400000002', party_id: 'a0000001-0001-4001-8001-000000000002', original_party_id: 'a0000001-0001-4001-8001-000000000002', contract_code: 'CMS-2024-00002', contract_title: 'Perjanjian Layanan Induk', doc_type: 'MSA', agreement_date: '2024-09-11', duration_months: 60, renewal_date: '2029-09-11', expiry_date: '2029-09-11', owner: 'Ayu', status: 'active', status_text: 'Active', validation_status: 'ok', extracted_metadata: {}, confirmed_metadata: {} },
      { id: 'b0000001-0001-4001-8001-202500000003', party_id: 'a0000001-0001-4001-8001-000000000003', original_party_id: 'a0000001-0001-4001-8001-000000000003', contract_code: 'CMS-2025-00003', contract_title: 'Perjanjian Layanan Induk', doc_type: 'MSA', agreement_date: '2025-03-04', duration_months: 37, renewal_date: '2028-04-04', expiry_date: '2028-04-04', owner: 'Dewi', status: 'active', status_text: 'Active', validation_status: 'pending', validation_notes: 'Odoo link pending', extracted_metadata: {}, confirmed_metadata: {} },
      { id: 'b0000001-0001-4001-8001-201900000006', party_id: 'a0000001-0001-4001-8001-000000000006', original_party_id: 'a0000001-0001-4001-8001-000000000006', contract_code: 'CMS-2019-00006', contract_title: 'Perjanjian Layanan Telekomunikasi Induk', doc_type: 'MSA', agreement_date: '2019-09-04', duration_months: 60, renewal_date: '2026-04-29', expiry_date: '2026-07-28', owner: 'Keshia', status: 'active', status_text: 'Active', validation_status: 'ok', extracted_metadata: {}, confirmed_metadata: {} },
      { id: 'b0000001-0001-4001-8001-202000000007', party_id: 'a0000001-0001-4001-8001-000000000007', original_party_id: 'a0000001-0001-4001-8001-000000000007', contract_code: 'CMS-2020-00007', contract_title: 'Perjanjian Layanan Induk', doc_type: 'MSA', agreement_date: '2020-08-24', duration_months: 60, renewal_date: '2025-08-24', expiry_date: '2025-08-24', owner: 'Ayu', status: 'active', status_text: 'Active', validation_status: 'ok', extracted_metadata: {}, confirmed_metadata: {} },
      { id: 'b0000001-0001-4001-8001-201700000009', party_id: 'a0000001-0001-4001-8001-000000000009', original_party_id: 'a0000001-0001-4001-8001-000000000009', contract_code: 'CMS-2017-00009', contract_title: 'Perjanjian untuk Layanan Alih Daya IT', doc_type: 'MSA', agreement_date: '2017-03-15', duration_months: 60, owner: 'Itania', status: 'active', status_text: 'Active', validation_status: 'ok', extracted_metadata: {}, confirmed_metadata: {} },
      { id: 'b0000001-0001-4001-8001-201700000013', party_id: 'a0000001-0001-4001-8001-000000000013', original_party_id: 'a0000001-0001-4001-8001-000000000013', contract_code: 'CMS-2017-00013', contract_title: 'Perjanjian Layanan Induk', doc_type: 'MSA', agreement_date: '2017-08-30', duration_months: 60, owner: 'Verlando', status: 'active', status_text: 'Active', validation_status: 'ok', extracted_metadata: {}, confirmed_metadata: {} },
      { id: 'b0000001-0001-4001-8001-202100000023', party_id: 'a0000001-0001-4001-8001-000000000023', original_party_id: 'a0000001-0001-4001-8001-000000000023', contract_code: 'CMS-2021-00023', contract_title: 'Agreement for Business Continuity Management Service', doc_type: 'MSA', agreement_date: '2021-11-15', duration_months: 60, renewal_date: '2026-11-15', expiry_date: '2026-11-15', owner: 'Dewi', status: 'active', status_text: 'Active', validation_status: 'ok', extracted_metadata: {}, confirmed_metadata: {} },
      { id: 'b0000001-0001-4001-8001-201900000025', party_id: 'a0000001-0001-4001-8001-000000000025', original_party_id: 'a0000001-0001-4001-8001-000000000025', contract_code: 'CMS-2019-00025', contract_title: 'Perjanjian Layanan Induk', doc_type: 'MSA', agreement_date: '2019-11-25', duration_months: 36, owner: 'Dewi', status: 'active', status_text: 'Active', validation_status: 'ok', extracted_metadata: {}, confirmed_metadata: {} },
      { id: 'b0000001-0001-4001-8001-202200000041', party_id: 'a0000001-0001-4001-8001-000000000041', original_party_id: 'a0000001-0001-4001-8001-000000000041', contract_code: 'CMS-2022-00041', contract_title: 'Perjanjian Kerja Sama', doc_type: 'MSA', agreement_date: '2022-02-15', duration_months: 36, owner: 'Dewi', status: 'under_review', status_text: 'Under Review', validation_status: 'pending', extracted_metadata: {}, confirmed_metadata: {} },
      { id: 'b0000001-0001-4001-8001-202200000073', party_id: 'a0000001-0001-4001-8001-000000000073', original_party_id: 'a0000001-0001-4001-8001-000000000073', contract_code: 'CMS-2022-00073', contract_title: 'Perjanjian Penggunaan Jasa Layanan Pusat Data', doc_type: 'MSA', agreement_date: '2022-10-31', duration_months: 12, owner: 'Verlando', status: 'active', status_text: 'Active', validation_status: 'ok', extracted_metadata: {}, confirmed_metadata: {} },
      { id: 'b0000001-0001-4001-8001-202100000079', party_id: 'a0000001-0001-4001-8001-000000000079', original_party_id: 'a0000001-0001-4001-8001-000000000079', contract_code: 'CMS-2021-00079', contract_title: 'Perjanjian Layanan Induk', doc_type: 'MSA', agreement_date: '2021-08-13', duration_months: 60, renewal_date: '2026-08-13', expiry_date: '2026-08-13', owner: 'Jessie', status: 'active', status_text: 'Active', validation_status: 'ok', extracted_metadata: {}, confirmed_metadata: {} },
      { id: 'b0000001-0001-4001-8001-201700000098', party_id: 'a0000001-0001-4001-8001-000000000098', original_party_id: 'a0000001-0001-4001-8001-000000000098', contract_code: 'CMS-2017-00098', contract_title: 'Perjanjian Layanan Pusat Data', doc_type: 'MSA', agreement_date: '2017-05-08', duration_months: 24, renewal_date: '2027-03-03', expiry_date: '2027-03-03', owner: 'Dewi', status: 'active', status_text: 'Active', validation_status: 'mismatch', validation_notes: 'Odoo Partner mismatch', extracted_metadata: {}, confirmed_metadata: {} },
      { id: 'b0000001-0001-4001-8001-202500000228', party_id: 'a0000001-0001-4001-8001-000000000228', original_party_id: 'a0000001-0001-4001-8001-000000000228', contract_code: 'CMS-2025-00228', contract_title: 'Perjanjian Layanan Induk', doc_type: 'MSA', agreement_date: '2025-08-04', duration_months: 12, renewal_date: '2026-08-04', expiry_date: '2026-08-28', owner: 'Verlando', status: 'under_review', status_text: 'Under Review', validation_status: 'ok', extracted_metadata: {}, confirmed_metadata: {} },
      { id: 'b0000001-0001-4001-8001-000000000102', party_id: 'a0000001-0001-4001-8001-000000000102', original_party_id: 'a0000001-0001-4001-8001-000000000102', contract_code: 'CMS-2025-00102', contract_title: 'Tidak ada MSA', doc_type: 'Other', duration_months: 36, owner: 'Itania', status: 'draft', status_text: 'Draft', validation_status: 'pending', validation_notes: 'Data tidak lengkap', extracted_metadata: {}, confirmed_metadata: {} },
    ]],
    ['contract_amendments', [
      { id: 'c0000001-0001-4001-8001-000000000001', parent_contract_id: 'b0000001-0001-4001-8001-201800000001', party_id: 'a0000001-0001-4001-8001-000000000001', amendment_code: 'CMS-2018-00001-AMD-01', title: 'Amendment', effective_date: '2020-11-17', summary: 'Pasal 5.6, 3.12, 14.3', status: 'fully_signed', status_text: 'Fully Signed' },
      { id: 'c0000001-0001-4001-8001-000000000004', parent_contract_id: 'b0000001-0001-4001-8001-201900000006', party_id: 'a0000001-0001-4001-8001-000000000006', amendment_code: 'CMS-2019-00006-AMD-03', title: 'Amendment III to MSA', effective_date: '2024-12-17', summary: 'Menunggu tanda tangan counterparty', status: 'ready_for_sign', status_text: 'Ready for Signature' },
      { id: 'c0000001-0001-4001-8001-000000000006', parent_contract_id: 'b0000001-0001-4001-8001-202200000041', party_id: 'a0000001-0001-4001-8001-000000000041', amendment_code: 'CMS-2022-00041-AMD-01', title: 'Amandemen', effective_date: '2026-04-23', summary: 'Perpanjangan & penambahan kapasitas', status: 'ready_for_sign', status_text: 'Ready for Signature' },
    ]],
    ['contract_terminations', [
      { id: 'd0000001-0001-4001-8001-000000000001', contract_id: 'b0000001-0001-4001-8001-202200000073', party_id: 'a0000001-0001-4001-8001-000000000073', termination_type: 'Mutual Agreement', effective_date: '2026-07-15', reason: 'Ilustratif — early termination demo', status: 'scheduled' },
    ]],
    ['contract_counterparty_changes', [
      { id: 'e0000001-0001-4001-8001-000000000001', contract_id: 'b0000001-0001-4001-8001-201900000025', from_party_id: 'a0000001-0001-4001-8001-000000000025', to_party_id: 'a0000001-0001-4001-8001-0000000025b0', change_type: 'Novation / Party Transfer', effective_date: '2020-02-04', reason: 'Surat Pemberitahuan Novasi' },
    ]],
    ['sale_orders', [
      { party_id: 'a0000001-0001-4001-8001-000000000001', odoo_order_id: 50001, odoo_partner_id: 1001, name: 'SO/2018/00104', state: 'done', amount_total: 1250000000, date_order: '2018-12-01T03:00:00Z' },
      { party_id: 'a0000001-0001-4001-8001-000000000006', odoo_order_id: 50006, odoo_partner_id: 1006, name: 'SO/2019/00441', state: 'sale', amount_total: 890000000, date_order: '2019-09-10T02:00:00Z' },
      { party_id: 'a0000001-0001-4001-8001-000000000079', odoo_order_id: 50079, odoo_partner_id: 1079, name: 'SO/2021/00201', state: 'done', amount_total: 450000000, date_order: '2021-08-01T02:00:00Z' },
      { party_id: 'a0000001-0001-4001-8001-000000000228', odoo_order_id: 50228, odoo_partner_id: 1228, name: 'SO/2025/00888', state: 'sale', amount_total: 120000000, date_order: '2025-08-01T02:00:00Z' },
    ]],
    ['documents', [
      { id: 'f0000001-0001-4001-8001-000000000001', party_id: 'a0000001-0001-4001-8001-000000000001', contract_id: 'b0000001-0001-4001-8001-201800000001', storage_path: 'demo/PTY-00001/MSA.pdf', file_name: 'MSA-Customer-ABC-2018.pdf', mime_type: 'application/pdf', status: 'confirmed', document_category: 'contract', description: 'Master Agreement (demo)' },
      { id: 'f0000001-0001-4001-8001-000000000002', party_id: 'a0000001-0001-4001-8001-000000000001', contract_id: 'b0000001-0001-4001-8001-201800000001', storage_path: 'demo/PTY-00001/supporting/pic.pdf', file_name: 'Surat Konfirmasi PIC Teknis.pdf', mime_type: 'application/pdf', status: 'confirmed', document_category: 'supporting', description: 'Correspondence' },
    ]],
    ['audit_logs', [
      { action: 'Contract Record dibuat — Master Agreement (ABC/2021/ABC)', action_type: 'create', party_id: 'a0000001-0001-4001-8001-000000000001', contract_id: 'b0000001-0001-4001-8001-201800000001', actor_name: 'Keshia', payload: {}, created_at: '2018-12-17T03:15:00Z' },
      { action: 'Amendment III — Ready for Signature', action_type: 'amendment', party_id: 'a0000001-0001-4001-8001-000000000006', contract_id: 'b0000001-0001-4001-8001-201900000006', actor_name: 'Keshia', payload: {}, created_at: '2024-12-17T02:12:00Z' },
      { action: 'Novation diterapkan — Surat Pemberitahuan Novasi', action_type: 'cp', party_id: 'a0000001-0001-4001-8001-0000000025b0', contract_id: 'b0000001-0001-4001-8001-201900000025', actor_name: 'Dewi', payload: {}, created_at: '2020-02-04T04:00:00Z' },
      { action: 'SO Sync batch — 1 order(s) dari Odoo', action_type: 'sync', party_id: 'a0000001-0001-4001-8001-000000000001', actor_name: 'CMS', payload: { ordersUpserted: 1 }, created_at: new Date(Date.now() - 86400000).toISOString() },
      { action: 'SO Sync gagal — PTY-00098: Partner Odoo #9998 tidak ditemukan', action_type: 'sync_error', party_id: 'a0000001-0001-4001-8001-000000000098', actor_name: 'CMS', payload: { partnerId: 9998 }, created_at: new Date(Date.now() - 172800000).toISOString() },
    ]],
  ]

  for (const [table, rows] of steps) {
    const { error } = await db.from(table).insert(rows)
    if (error) {
      console.error(`Failed on ${table}:`, error.message)
      process.exit(1)
    }
    console.log(`✓ ${table}: ${rows.length} rows`)
  }

  console.log('\nDemo seed complete — open /parties and /renewal')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
