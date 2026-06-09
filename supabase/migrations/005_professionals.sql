-- Sprint 005: professionals table and professional_tier enum

do $$ begin
  if not exists (select 1 from pg_type where typname = 'professional_tier') then
    create type professional_tier as enum ('in_depth', 'general');
  end if;
end $$;

create table if not exists professionals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  tier professional_tier not null default 'general',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table professionals enable row level security;

drop policy if exists "service all" on professionals;
create policy "service all" on professionals
  for all
  using (true)
  with check (true);
