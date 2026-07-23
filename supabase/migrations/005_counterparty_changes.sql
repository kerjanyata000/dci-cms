-- Counterparty change history (FR-CNT-CP / BRL-CMS-007)

alter table public.contracts
  add column if not exists original_party_id uuid references public.parties (id) on delete set null;

create table if not exists public.contract_counterparty_changes (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts (id) on delete cascade,
  from_party_id uuid not null references public.parties (id) on delete restrict,
  to_party_id uuid not null references public.parties (id) on delete restrict,
  change_type text not null,
  effective_date date,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists cp_changes_contract_idx on public.contract_counterparty_changes (contract_id);
create index if not exists cp_changes_from_party_idx on public.contract_counterparty_changes (from_party_id);
create index if not exists cp_changes_to_party_idx on public.contract_counterparty_changes (to_party_id);

-- Backfill original_party_id for existing contracts
update public.contracts
set original_party_id = party_id
where original_party_id is null;

alter table public.contract_counterparty_changes enable row level security;

create policy "cp_changes_select_authenticated" on public.contract_counterparty_changes
  for select to authenticated using (true);
