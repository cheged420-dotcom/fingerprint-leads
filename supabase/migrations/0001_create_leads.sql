-- Fingerprint Builders: leads table
create extension if not exists "pgcrypto";

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  source text,
  campaign text,

  name text,
  phone text,
  email text,

  project_type text check (
    project_type in ('Residential', 'Commercial', 'Industrial', 'Renovation')
  ),
  location text,

  budget_band text check (
    budget_band in ('under 5M', '5-10M', '10-20M', '20M+')
  ),
  estimated_value numeric,

  has_land boolean,
  has_drawings boolean,

  timeline text check (
    timeline in ('ready now', '3-6 months', '6-12 months', 'exploring')
  ),

  diaspora boolean,
  diaspora_country text,

  message text,

  stage text not null default 'New Inquiry',
  lead_score integer,
  assigned_to text,

  first_contacted_at timestamptz,
  consent boolean
);

-- Keep updated_at current on every row update
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
  before update on public.leads
  for each row
  execute function public.set_updated_at();

-- Lock the table down by default. The app talks to Supabase using the
-- service role key from server-side code only, which bypasses RLS.
-- No public policies are created here on purpose.
alter table public.leads enable row level security;
