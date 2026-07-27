-- Party master fields + document void (FR-PTY-EDIT/DEL, FR-CNT-SUP-005/006)

alter table public.parties
  add column if not exists npwp text,
  add column if not exists address text,
  add column if not exists party_type text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text;

alter table public.documents
  add column if not exists voided_at timestamptz,
  add column if not exists void_reason text;

create index if not exists documents_voided_at_idx on public.documents (voided_at)
  where voided_at is not null;

comment on column public.parties.npwp is 'Tax ID / NPWP — sensitive Party Master field (BRL-CMS-004)';
comment on column public.documents.voided_at is 'Soft-void supporting docs without deleting storage (BRL-CMS-016)';
