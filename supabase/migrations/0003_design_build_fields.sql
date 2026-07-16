alter table public.leads
  add column if not exists site_visit_fee numeric,
  add column if not exists drawings_fee numeric,
  add column if not exists construction_value numeric;
