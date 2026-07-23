-- Amendments + document category (FR-CNT-AMD / FR-CNT-SUP)

alter table public.documents
  add column if not exists document_category text not null default 'contract',
  add column if not exists description text;

create table if not exists public.contract_amendments (
  id uuid primary key default gen_random_uuid(),
  parent_contract_id uuid not null references public.contracts (id) on delete cascade,
  party_id uuid not null references public.parties (id) on delete cascade,
  amendment_code text not null unique,
  title text not null,
  doc_type text not null default 'Amendment',
  change_category text,
  effective_date date,
  reason text,
  summary text,
  status text not null default 'draft',
  status_text text not null default 'Draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contract_amendments_party_id_idx on public.contract_amendments (party_id);
create index if not exists contract_amendments_parent_idx on public.contract_amendments (parent_contract_id);
create index if not exists documents_category_idx on public.documents (document_category);

alter table public.contract_amendments enable row level security;

create policy "amendments_select_authenticated" on public.contract_amendments
  for select to authenticated using (true);

create policy "documents_insert_authenticated" on public.documents
  for insert to authenticated with check (true);
