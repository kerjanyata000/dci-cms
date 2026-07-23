-- Demo seed data aligned with CMS_Mockup.html (seedParties / seedAudit / renewalDataRaw)
-- Idempotent: skips when PTY-00001 already exists.
-- Run after migrations 001–007. Safe to re-run on empty DB only.

do $seed$
begin
  if exists (select 1 from public.parties where party_code = 'PTY-00001') then
    raise notice 'Demo seed skipped — PTY-00001 already exists';
    return;
  end if;

  -- ── Parties (15 dari mockup) ─────────────────────────────────────────────
  insert into public.parties (id, party_code, name, pic, odoo_partner_id, odoo_link_status, party_status) values
    ('a0000001-0001-4001-8001-000000000001', 'PTY-00001', 'Customer ABC', 'Keshia', 1001, 'linked', 'Active'),
    ('a0000001-0001-4001-8001-000000000002', 'PTY-00002', 'Party No. 002', 'Ayu', 1002, 'linked', 'Active'),
    ('a0000001-0001-4001-8001-000000000003', 'PTY-00003', 'Party No. 003', 'Dewi', null, 'pending', 'Active'),
    ('a0000001-0001-4001-8001-000000000006', 'PTY-00006', 'Party No. 006', 'Keshia', 1006, 'linked', 'Active'),
    ('a0000001-0001-4001-8001-000000000007', 'PTY-00007', 'Party No. 007', 'Ayu', 1007, 'linked', 'Active'),
    ('a0000001-0001-4001-8001-000000000009', 'PTY-00009', 'Party No. 009', 'Itania', 1009, 'linked', 'Active'),
    ('a0000001-0001-4001-8001-000000000013', 'PTY-00013', 'Party No. 013', 'Verlando', 1013, 'linked', 'Active'),
    ('a0000001-0001-4001-8001-000000000023', 'PTY-00023', 'Party No. 023', 'Dewi', 1023, 'linked', 'Active'),
    ('a0000001-0001-4001-8001-000000000025', 'PTY-00025', 'Party No. 025', 'Dewi', 1025, 'linked', 'Active'),
    ('a0000001-0001-4001-8001-0000000025b0', 'PTY-00025-B', 'Party No. 025-B (post-novation)', 'Dewi', 1025, 'linked', 'Active'),
    ('a0000001-0001-4001-8001-000000000041', 'PTY-00041', 'Party No. 041', 'Dewi', null, 'pending', 'Active'),
    ('a0000001-0001-4001-8001-000000000073', 'PTY-00073', 'Party No. 073', 'Verlando', 1073, 'linked', 'Active'),
    ('a0000001-0001-4001-8001-000000000079', 'PTY-00079', 'Party No. 079', 'Jessie', 1079, 'linked', 'Active'),
    ('a0000001-0001-4001-8001-000000000098', 'PTY-00098', 'Party No. 098', 'Dewi', 9998, 'mismatch', 'Active'),
    ('a0000001-0001-4001-8001-000000000228', 'PTY-00228', 'Party No. 228', 'Verlando', 1228, 'linked', 'Active'),
    ('a0000001-0001-4001-8001-000000000102', 'PTY-00102', 'Party No. 102', 'Itania', null, 'pending', 'Active');

  -- ── Contracts ────────────────────────────────────────────────────────────
  insert into public.contracts (
    id, party_id, original_party_id, contract_code, contract_title, doc_type,
    agreement_no, agreement_date, duration_months, renewal_date, expiry_date,
    owner, department, status, status_text,
    extracted_metadata, confirmed_metadata, validation_status, validation_notes
  ) values
  (
    'b0000001-0001-4001-8001-201800000001',
    'a0000001-0001-4001-8001-000000000001',
    'a0000001-0001-4001-8001-000000000001',
    'CMS-2018-00001', 'Master Services Agreement', 'MSA',
    'ABC/2021/ABC', '2018-12-17', 60, '2023-09-18', '2023-12-17',
    'Keshia', 'Legal', 'active', 'Active',
    '{"counterpartyName":"Customer ABC","agreementNo":"ABC/2021/ABC","contractValue":"USD XXX,XXX,XXX.00","paymentTerm":"45 hari","latePaymentPenalty":"1.5% / bulan","autoRenewal":"Ya"}'::jsonb,
    '{"counterpartyName":"Customer ABC","agreementNo":"ABC/2021/ABC","contractValue":"USD XXX,XXX,XXX.00","paymentTerm":"45 hari","latePaymentPenalty":"1.5% / bulan","autoRenewal":"Ya","earlyTerminationFee":"Berlaku (klausul YES)"}'::jsonb,
    'ok', null
  ),
  (
    'b0000001-0001-4001-8001-202400000002',
    'a0000001-0001-4001-8001-000000000002',
    'a0000001-0001-4001-8001-000000000002',
    'CMS-2024-00002', 'Perjanjian Layanan Induk', 'MSA',
    null, '2024-09-11', 60, '2029-06-13', '2029-09-11',
    'Ayu', 'Legal', 'active', 'Active',
    '{}'::jsonb,
    '{"counterpartyName":"Party No. 002","paymentTerm":"30 hari","autoRenewal":"Ya"}'::jsonb,
    'ok', null
  ),
  (
    'b0000001-0001-4001-8001-202500000003',
    'a0000001-0001-4001-8001-000000000003',
    'a0000001-0001-4001-8001-000000000003',
    'CMS-2025-00003', 'Perjanjian Layanan Induk', 'MSA',
    null, '2025-03-04', 37, '2028-03-04', '2028-04-04',
    'Dewi', 'Legal', 'active', 'Active',
    '{}'::jsonb,
    '{"counterpartyName":"Party No. 003","paymentTerm":"30 hari","autoRenewal":"Ya"}'::jsonb,
    'pending', 'Odoo link pending'
  ),
  (
    'b0000001-0001-4001-8001-201900000006',
    'a0000001-0001-4001-8001-000000000006',
    'a0000001-0001-4001-8001-000000000006',
    'CMS-2019-00006', 'Perjanjian Layanan Telekomunikasi Induk', 'MSA',
    null, '2019-09-04', 60, '2024-06-06', '2024-09-04',
    'Keshia', 'Legal', 'active', 'Active',
    '{}'::jsonb,
    '{"counterpartyName":"Party No. 006","paymentTerm":"45 hari","autoRenewal":"Ya"}'::jsonb,
    'ok', null
  ),
  (
    'b0000001-0001-4001-8001-202000000007',
    'a0000001-0001-4001-8001-000000000007',
    'a0000001-0001-4001-8001-000000000007',
    'CMS-2020-00007', 'Perjanjian Layanan Induk', 'MSA',
    null, '2020-08-24', 60, '2025-05-26', '2025-08-24',
    'Ayu', 'Legal', 'active', 'Active',
    '{}'::jsonb,
    '{"counterpartyName":"Party No. 007","paymentTerm":"30 hari"}'::jsonb,
    'ok', null
  ),
  (
    'b0000001-0001-4001-8001-201700000009',
    'a0000001-0001-4001-8001-000000000009',
    'a0000001-0001-4001-8001-000000000009',
    'CMS-2017-00009', 'Perjanjian untuk Layanan Alih Daya IT', 'MSA',
    null, '2017-03-15', 60, '2022-12-15', '2023-03-15',
    'Itania', 'Legal', 'active', 'Active',
    '{}'::jsonb,
    '{"counterpartyName":"Party No. 009","paymentTerm":"30 hari","autoRenewal":"Ya"}'::jsonb,
    'ok', null
  ),
  (
    'b0000001-0001-4001-8001-201700000013',
    'a0000001-0001-4001-8001-000000000013',
    'a0000001-0001-4001-8001-000000000013',
    'CMS-2017-00013', 'Perjanjian Layanan Induk', 'MSA',
    null, '2017-08-30', 60, '2022-05-31', '2022-08-30',
    'Verlando', 'Legal', 'active', 'Active',
    '{}'::jsonb,
    '{"counterpartyName":"Party No. 013","paymentTerm":"30 hari","autoRenewal":"Ya"}'::jsonb,
    'ok', null
  ),
  (
    'b0000001-0001-4001-8001-202100000023',
    'a0000001-0001-4001-8001-000000000023',
    'a0000001-0001-4001-8001-000000000023',
    'CMS-2021-00023', 'Agreement for Business Continuity Management Service', 'MSA',
    null, '2021-11-15', 60, '2026-08-17', '2026-11-15',
    'Dewi', 'Legal', 'active', 'Active',
    '{}'::jsonb,
    '{"counterpartyName":"Party No. 023","paymentTerm":"30 hari"}'::jsonb,
    'ok', null
  ),
  (
    'b0000001-0001-4001-8001-201900000025',
    'a0000001-0001-4001-8001-000000000025',
    'a0000001-0001-4001-8001-000000000025',
    'CMS-2019-00025', 'Perjanjian Layanan Induk', 'MSA',
    null, '2019-11-25', 36, '2022-08-27', '2022-11-25',
    'Dewi', 'Legal', 'active', 'Active',
    '{}'::jsonb,
    '{"counterpartyName":"Party No. 025","paymentTerm":"30 hari"}'::jsonb,
    'ok', null
  ),
  (
    'b0000001-0001-4001-8001-202200000041',
    'a0000001-0001-4001-8001-000000000041',
    'a0000001-0001-4001-8001-000000000041',
    'CMS-2022-00041', 'Perjanjian Kerja Sama', 'MSA',
    null, '2022-02-15', 36, '2025-11-17', '2025-02-15',
    'Dewi', 'Legal', 'under_review', 'Under Review',
    '{}'::jsonb,
    '{"counterpartyName":"Party No. 041","paymentTerm":"30 hari"}'::jsonb,
    'pending', null
  ),
  (
    'b0000001-0001-4001-8001-202200000073',
    'a0000001-0001-4001-8001-000000000073',
    'a0000001-0001-4001-8001-000000000073',
    'CMS-2022-00073', 'Perjanjian Penggunaan Jasa Layanan Pusat Data', 'MSA',
    null, '2022-10-31', 12, '2023-08-02', '2023-10-31',
    'Verlando', 'Legal', 'active', 'Active',
    '{}'::jsonb,
    '{"counterpartyName":"Party No. 073","paymentTerm":"14 hari"}'::jsonb,
    'ok', null
  ),
  (
    'b0000001-0001-4001-8001-202100000079',
    'a0000001-0001-4001-8001-000000000079',
    'a0000001-0001-4001-8001-000000000079',
    'CMS-2021-00079', 'Perjanjian Layanan Induk', 'MSA',
    null, '2021-08-13', 60, '2026-05-15', '2026-08-13',
    'Jessie', 'Legal', 'active', 'Active',
    '{}'::jsonb,
    '{"counterpartyName":"Party No. 079","paymentTerm":"30 hari","autoRenewal":"Ya"}'::jsonb,
    'ok', null
  ),
  (
    'b0000001-0001-4001-8001-201700000098',
    'a0000001-0001-4001-8001-000000000098',
    'a0000001-0001-4001-8001-000000000098',
    'CMS-2017-00098', 'Perjanjian Layanan Pusat Data', 'MSA',
    null, '2017-05-08', 24, '2027-03-03', '2027-03-03',
    'Dewi', 'Legal', 'active', 'Active',
    '{}'::jsonb,
    '{"counterpartyName":"Party No. 098","paymentTerm":"30 hari"}'::jsonb,
    'mismatch', 'Odoo Partner mismatch'
  ),
  (
    'b0000001-0001-4001-8001-202500000228',
    'a0000001-0001-4001-8001-000000000228',
    'a0000001-0001-4001-8001-000000000228',
    'CMS-2025-00228', 'Perjanjian Layanan Induk', 'MSA',
    null, '2025-08-04', 12, '2026-08-04', '2026-08-04',
    'Verlando', 'Legal', 'under_review', 'Under Review',
    '{}'::jsonb,
    '{"counterpartyName":"Party No. 228","paymentTerm":"30 hari"}'::jsonb,
    'ok', null
  ),
  (
    'b0000001-0001-4001-8001-000000000102',
    'a0000001-0001-4001-8001-000000000102',
    'a0000001-0001-4001-8001-000000000102',
    'CMS-2025-00102', 'Tidak ada MSA', 'Other',
    null, null, 36, null, null,
    'Itania', 'Legal', 'draft', 'Draft',
    '{}'::jsonb,
    '{"counterpartyName":"Party No. 102"}'::jsonb,
    'pending', 'Data tidak lengkap'
  );

  -- Renewal calendar highlights (override renewal_date untuk mockup parity)
  update public.contracts set renewal_date = '2026-07-21' where contract_code = 'CMS-2018-00001';
  update public.contracts set renewal_date = '2026-08-13' where contract_code = 'CMS-2021-00079';
  update public.contracts set renewal_date = '2026-08-04', expiry_date = '2026-08-28' where contract_code = 'CMS-2025-00228';
  update public.contracts set expiry_date = '2026-07-28', renewal_date = '2026-04-29' where contract_code = 'CMS-2019-00006';

  -- ── Amendments ───────────────────────────────────────────────────────────
  insert into public.contract_amendments (
    id, parent_contract_id, party_id, amendment_code, title, doc_type,
    change_category, effective_date, reason, summary, status, status_text
  ) values
  (
    'c0000001-0001-4001-8001-000000000001',
    'b0000001-0001-4001-8001-201800000001',
    'a0000001-0001-4001-8001-000000000001',
    'CMS-2018-00001-AMD-01', 'Amendment', 'Amendment',
    'Commercial', '2020-11-17', 'Pasal 5.6, 3.12, 14.3',
    'i. Penambahan Pasal 5.6 · ii. Penggantian Pasal 3.12 · iii. Penggantian Pasal 14.3',
    'fully_signed', 'Fully Signed'
  ),
  (
    'c0000001-0001-4001-8001-000000000002',
    'b0000001-0001-4001-8001-201900000006',
    'a0000001-0001-4001-8001-000000000006',
    'CMS-2019-00006-AMD-01', 'Amendment I to MSA', 'Amendment',
    'Scope', '2019-09-17', null,
    'Perubahan bagian 3.7 Lampiran Layanan Colocation',
    'fully_signed', 'Fully Signed'
  ),
  (
    'c0000001-0001-4001-8001-000000000003',
    'b0000001-0001-4001-8001-201900000006',
    'a0000001-0001-4001-8001-000000000006',
    'CMS-2019-00006-AMD-02', 'Amendment II to MSA', 'Amendment',
    'Legal', '2020-02-03', null,
    'Bagian 3.1(d) Lampiran D dinyatakan tidak berlaku',
    'fully_signed', 'Fully Signed'
  ),
  (
    'c0000001-0001-4001-8001-000000000004',
    'b0000001-0001-4001-8001-201900000006',
    'a0000001-0001-4001-8001-000000000006',
    'CMS-2019-00006-AMD-03', 'Amendment III to MSA', 'Amendment',
    'Commercial', '2024-12-17', null,
    'Draft amendment — menunggu tanda tangan counterparty',
    'ready_for_sign', 'Ready for Signature'
  ),
  (
    'c0000001-0001-4001-8001-000000000005',
    'b0000001-0001-4001-8001-202200000073',
    'a0000001-0001-4001-8001-000000000073',
    'CMS-2022-00073-AMD-01', 'Addendum II', 'Amendment',
    'Commercial', '2025-04-21', null,
    'Addendum kapasitas daya colocation',
    'fully_signed', 'Fully Signed'
  ),
  (
    'c0000001-0001-4001-8001-000000000006',
    'b0000001-0001-4001-8001-202200000041',
    'a0000001-0001-4001-8001-000000000041',
    'CMS-2022-00041-AMD-01', 'Amandemen', 'Amendment',
    'Period', '2026-04-23', null,
    'Perpanjangan & penambahan kapasitas daya',
    'ready_for_sign', 'Ready for Signature'
  );

  -- ── Early termination (Party 073) ────────────────────────────────────────
  insert into public.contract_terminations (
    id, contract_id, party_id, termination_type, effective_date, reason, summary, status
  ) values (
    'd0000001-0001-4001-8001-000000000001',
    'b0000001-0001-4001-8001-202200000073',
    'a0000001-0001-4001-8001-000000000073',
    'Mutual Agreement', '2026-07-15',
    'Ilustratif — contoh early termination (register/audit)',
    'Scheduled — original expiry 31 Okt 2023',
    'scheduled'
  );

  -- ── Counterparty change / novation (Party 025) ───────────────────────────
  insert into public.contract_counterparty_changes (
    id, contract_id, from_party_id, to_party_id, change_type, effective_date, reason
  ) values (
    'e0000001-0001-4001-8001-000000000001',
    'b0000001-0001-4001-8001-201900000025',
    'a0000001-0001-4001-8001-000000000025',
    'a0000001-0001-4001-8001-0000000025b0',
    'Novation / Party Transfer', '2020-02-04',
    'Surat Pemberitahuan Novasi'
  );

  -- ── Sale orders (mirror Odoo) ────────────────────────────────────────────
  insert into public.sale_orders (party_id, odoo_order_id, odoo_partner_id, name, state, amount_total, date_order, synced_at) values
    ('a0000001-0001-4001-8001-000000000001', 50001, 1001, 'SO/2018/00104', 'done', 1250000000, '2018-12-01 10:00:00+07', now()),
    ('a0000001-0001-4001-8001-000000000006', 50006, 1006, 'SO/2019/00441', 'sale', 890000000, '2019-09-10 09:00:00+07', now()),
    ('a0000001-0001-4001-8001-000000000079', 50079, 1079, 'SO/2021/00201', 'done', 450000000, '2021-08-01 09:00:00+07', now()),
    ('a0000001-0001-4001-8001-000000000228', 50228, 1228, 'SO/2025/00888', 'sale', 120000000, '2025-08-01 09:00:00+07', now());
  -- PTY-00023 sengaja tanpa SO → No Active SO flag (NOTIF-CMS-014)

  -- ── Documents (metadata demo — tanpa file Storage/RAGFlow) ───────────────
  insert into public.documents (
    id, party_id, contract_id, storage_path, file_name, mime_type,
    status, document_category, description
  ) values
  (
    'f0000001-0001-4001-8001-000000000001',
    'a0000001-0001-4001-8001-000000000001',
    'b0000001-0001-4001-8001-201800000001',
    'demo/PTY-00001/CMS-2018-00001/MSA-ABC-2018.pdf',
    'MSA-Customer-ABC-2018.pdf', 'application/pdf',
    'confirmed', 'contract', 'Master Agreement (demo seed)'
  ),
  (
    'f0000001-0001-4001-8001-000000000002',
    'a0000001-0001-4001-8001-000000000001',
    'b0000001-0001-4001-8001-201800000001',
    'demo/PTY-00001/supporting/surat-konfirmasi-pic.pdf',
    'Surat Konfirmasi PIC Teknis.pdf', 'application/pdf',
    'confirmed', 'supporting', 'Correspondence — Keshia'
  ),
  (
    'f0000001-0001-4001-8001-000000000003',
    'a0000001-0001-4001-8001-000000000001',
    'b0000001-0001-4001-8001-201800000001',
    'demo/PTY-00001/supporting/berita-acara-amendment.pdf',
    'Berita Acara Persetujuan Amendment.pdf', 'application/pdf',
    'confirmed', 'supporting', 'Internal Memo — Nov 2020'
  );

  -- ── Audit trail (global + per-party dari mockup) ─────────────────────────
  insert into public.audit_logs (action, action_type, party_id, contract_id, actor_name, payload, created_at) values
  ('Contract Record dibuat — Master Agreement (ABC/2021/ABC)', 'create', 'a0000001-0001-4001-8001-000000000001', 'b0000001-0001-4001-8001-201800000001', 'Keshia', '{}'::jsonb, '2018-12-17 10:15:00+07'),
  ('Status kontrak → Active (Fully Signed)', 'status', 'a0000001-0001-4001-8001-000000000001', 'b0000001-0001-4001-8001-201800000001', 'Keshia', '{}'::jsonb, '2018-12-18 08:50:00+07'),
  ('Amendment dibuat — CMS-2018-00001-AMD-01', 'amendment', 'a0000001-0001-4001-8001-000000000001', 'b0000001-0001-4001-8001-201800000001', 'Keshia', '{}'::jsonb, '2020-11-05 09:30:00+07'),
  ('Amendment Fully Signed (Pasal 5.6, 3.12, 14.3)', 'amendment', 'a0000001-0001-4001-8001-000000000001', null, 'Keshia', '{}'::jsonb, '2020-11-17 14:40:00+07'),
  ('Change Counterparty (Novation / Party Transfer) — CMS-2019-00025 → Party No. 025-B', 'cp', 'a0000001-0001-4001-8001-0000000025b0', 'b0000001-0001-4001-8001-201900000025', 'Dewi', '{}'::jsonb, '2020-02-04 11:00:00+07'),
  ('Amendment III diunggah — status Ready for Signature', 'amendment', 'a0000001-0001-4001-8001-000000000006', 'b0000001-0001-4001-8001-201900000006', 'Keshia', '{}'::jsonb, '2024-12-17 09:12:00+07'),
  ('Amandemen diunggah — perpanjangan & penambahan kapasitas daya', 'amendment', 'a0000001-0001-4001-8001-000000000041', 'b0000001-0001-4001-8001-202200000041', 'Dewi', '{}'::jsonb, '2026-04-23 10:00:00+07'),
  ('Supporting document uploaded — Berita Acara Persetujuan Amendment.pdf', 'upload', 'a0000001-0001-4001-8001-000000000001', 'b0000001-0001-4001-8001-201800000001', 'Keshia', '{}'::jsonb, '2020-11-17 09:00:00+07'),
  ('SO Sync batch — 1 order(s) dari Odoo (consume-only)', 'sync', 'a0000001-0001-4001-8001-000000000001', null, 'CMS', '{"ordersUpserted":1}'::jsonb, now() - interval '1 day'),
  ('SO Sync gagal — PTY-00098: Partner Odoo #9998 tidak ditemukan — periksa Link Odoo party', 'sync_error', 'a0000001-0001-4001-8001-000000000098', null, 'CMS', '{"partnerId":9998}'::jsonb, now() - interval '2 days'),
  ('Odoo Partner linked — Customer ABC → #1001 (linked)', 'link', 'a0000001-0001-4001-8001-000000000001', null, 'Legal Admin', '{"odoo_partner_id":1001}'::jsonb, '2019-01-02 09:00:00+07'),
  ('Early Termination — CMS-2022-00073 effective 2023-09-01', 'termination', 'a0000001-0001-4001-8001-000000000073', 'b0000001-0001-4001-8001-202200000073', 'Verlando', '{}'::jsonb, '2023-09-01 14:00:00+07'),
  ('Contract Record dibuat — Master Agreement', 'create', 'a0000001-0001-4001-8001-000000000228', 'b0000001-0001-4001-8001-202500000228', 'Verlando', '{}'::jsonb, '2025-08-04 09:00:00+07'),
  ('Party Record dibuat — Party No. 003', 'create', 'a0000001-0001-4001-8001-000000000003', null, 'Dewi', '{"odoo_link_status":"pending"}'::jsonb, '2025-03-04 09:05:00+07');

  raise notice 'Demo seed inserted — 16 parties, 15 contracts (CMS_Mockup.html)';
end $seed$;
