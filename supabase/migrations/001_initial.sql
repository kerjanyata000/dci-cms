-- CMS initial schema: parties, contracts, dual metadata, RAGFlow refs
-- Apply in Supabase SQL editor or via CLI migration.

create extension if not exists "pgcrypto";

-- Enums
create type public.odoo_link_status as enum (
  'unlinked',
  'pending',
  'linked',
  'mismatch',
  'relink',
  'not_required'
);

create type public.validation_status as enum (
  'pending',
  'ok',
  'mismatch',
  'low_confidence'
);

create type public.document_status as enum (
  'pending_upload',
  'pending_extraction',
  'extracted',
  'confirmed',
  'failed'
);

create type public.app_role as enum (
  'legal',
  'business',
  'finance',
  'management',
  'it'
);

-- Profiles (maps auth.users → CMS role)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role public.app_role not null default 'business',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.parties (
  id uuid primary key default gen_random_uuid(),
  party_code text not null unique,
  name text not null,
  pic text,
  odoo_partner_id integer,
  odoo_link_status public.odoo_link_status not null default 'unlinked',
  party_status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.parties (id) on delete restrict,
  contract_code text not null unique,
  doc_type text,
  agreement_no text,
  status text not null default 'draft',
  status_text text not null default 'Draft',
  -- Dual metadata (BRD: extracted vs user-confirmed)
  extracted_metadata jsonb not null default '{}'::jsonb,
  confirmed_metadata jsonb not null default '{}'::jsonb,
  validation_status public.validation_status not null default 'pending',
  validation_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  party_id uuid references public.parties (id) on delete set null,
  contract_id uuid references public.contracts (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  status public.document_status not null default 'pending_extraction',
  ragflow_dataset_id text,
  ragflow_doc_id text,
  extraction_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  action_type text,
  party_id uuid references public.parties (id) on delete set null,
  contract_id uuid references public.contracts (id) on delete set null,
  actor_id uuid references auth.users (id) on delete set null,
  actor_name text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index parties_odoo_partner_id_idx on public.parties (odoo_partner_id);
create index contracts_party_id_idx on public.contracts (party_id);
create index documents_contract_id_idx on public.documents (contract_id);
create index documents_ragflow_doc_id_idx on public.documents (ragflow_doc_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

alter table public.profiles enable row level security;
alter table public.parties enable row level security;
alter table public.contracts enable row level security;
alter table public.documents enable row level security;
alter table public.audit_logs enable row level security;

-- Starter policies: authenticated read; tighten per-role later
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "parties_select_authenticated" on public.parties
  for select to authenticated using (true);

create policy "contracts_select_authenticated" on public.contracts
  for select to authenticated using (true);

create policy "documents_select_authenticated" on public.documents
  for select to authenticated using (true);

create policy "audit_select_authenticated" on public.audit_logs
  for select to authenticated using (true);

-- Storage bucket (run in dashboard or via storage API): contracts
-- insert into storage.buckets (id, name, public) values ('contracts', 'contracts', false);
