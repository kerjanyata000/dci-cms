-- Contract lifecycle dates, SO mirror, early termination (FR-CNT-ADD / FR-DASH-004 / INT-SO)

alter table public.contracts
  add column if not exists contract_title text,
  add column if not exists agreement_date date,
  add column if not exists duration_months integer,
  add column if not exists renewal_date date,
  add column if not exists expiry_date date,
  add column if not exists owner text,
  add column if not exists department text,
  add column if not exists remarks text;

create table if not exists public.sale_orders (
  id uuid primary key default gen_random_uuid(),
  party_id uuid references public.parties (id) on delete set null,
  odoo_order_id integer not null unique,
  odoo_partner_id integer,
  name text not null,
  state text not null,
  amount_total numeric,
  date_order timestamptz,
  synced_at timestamptz not null default now()
);

create index if not exists sale_orders_party_id_idx on public.sale_orders (party_id);
create index if not exists sale_orders_odoo_partner_id_idx on public.sale_orders (odoo_partner_id);

create table if not exists public.contract_terminations (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts (id) on delete cascade,
  party_id uuid not null references public.parties (id) on delete cascade,
  termination_type text,
  effective_date date not null,
  reason text,
  summary text,
  status text not null default 'scheduled',
  created_at timestamptz not null default now()
);

create index if not exists contract_terminations_party_id_idx on public.contract_terminations (party_id);
create index if not exists contracts_expiry_date_idx on public.contracts (expiry_date);
create index if not exists contracts_renewal_date_idx on public.contracts (renewal_date);

alter table public.sale_orders enable row level security;
alter table public.contract_terminations enable row level security;

create policy "contracts_insert_authenticated" on public.contracts
  for insert to authenticated with check (true);

create policy "contracts_update_authenticated" on public.contracts
  for update to authenticated using (true) with check (true);

create policy "sale_orders_select_authenticated" on public.sale_orders
  for select to authenticated using (true);

create policy "terminations_select_authenticated" on public.contract_terminations
  for select to authenticated using (true);
