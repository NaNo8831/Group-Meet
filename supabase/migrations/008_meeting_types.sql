-- Migration 008: Meeting types, durations, roles, and pools (Sprint 008)
-- Apply in the Supabase SQL Editor AFTER running supabase/preflight/008_preflight.sql.
-- Safe to run twice: every statement is guarded so a second run changes nothing.
-- Rollback: supabase/rollbacks/008_meeting_types_rollback.sql
-- Check:    supabase/preflight/008_postcheck.sql

begin;

-- 0. Guard: the tables this migration depends on must exist.
do $$
begin
  if to_regclass('public.requests') is null then
    raise exception 'Migration 008 needs the requests table (Phase 1 Domain Schema). Not found.';
  end if;
  if to_regclass('public.professionals') is null then
    raise exception 'Migration 008 needs the professionals table (migration 005). Not found.';
  end if;
  if to_regclass('public.admins') is null then
    raise exception 'Migration 008 needs the admins table (migration 006). Not found.';
  end if;
end $$;

-- 1. meeting_types
create table if not exists meeting_types (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null check (char_length(title) between 1 and 120),
  slug                text not null unique
                        check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 60),
  landing_description text check (landing_description is null or char_length(landing_description) <= 2000),
  is_active           boolean not null default false,
  min_matched_slots   integer not null default 3 check (min_matched_slots >= 1),
  min_responses       integer check (min_responses is null or min_responses >= 1),
  created_by_admin_id uuid references admins(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- 2. meeting_type_durations
create table if not exists meeting_type_durations (
  id              uuid primary key default gen_random_uuid(),
  meeting_type_id uuid not null references meeting_types(id) on delete cascade,
  label           text not null check (char_length(label) between 1 and 40),
  minutes         integer not null check (minutes between 5 and 480 and minutes % 5 = 0),
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (meeting_type_id, label)
);

-- 3. meeting_type_roles
create table if not exists meeting_type_roles (
  id              uuid primary key default gen_random_uuid(),
  meeting_type_id uuid not null references meeting_types(id) on delete cascade,
  name            text not null check (char_length(name) between 1 and 40),
  required_count  integer not null default 1 check (required_count >= 1),
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (meeting_type_id, name),
  -- lets pool role links prove a role belongs to the same meeting type
  unique (id, meeting_type_id)
);

-- 4. meeting_type_pool
create table if not exists meeting_type_pool (
  meeting_type_id uuid not null references meeting_types(id) on delete cascade,
  professional_id uuid not null references professionals(id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (meeting_type_id, professional_id)
);

-- 5. meeting_type_pool_roles
create table if not exists meeting_type_pool_roles (
  meeting_type_id uuid not null,
  professional_id uuid not null,
  role_id         uuid not null,
  primary key (meeting_type_id, professional_id, role_id),
  foreign key (meeting_type_id, professional_id)
    references meeting_type_pool (meeting_type_id, professional_id) on delete cascade,
  -- a role can only be attached to a pool entry of the SAME meeting type
  foreign key (role_id, meeting_type_id)
    references meeting_type_roles (id, meeting_type_id) on delete cascade
);

create index if not exists idx_mt_durations_type on meeting_type_durations (meeting_type_id);
create index if not exists idx_mt_roles_type     on meeting_type_roles (meeting_type_id);
create index if not exists idx_mt_pool_prof      on meeting_type_pool (professional_id);

-- 6. requests: additive links (nullable until Sprint 009 writes them) and relax the old column
alter table requests
  add column if not exists meeting_type_id    uuid references meeting_types(id) on delete restrict,
  add column if not exists duration_id        uuid references meeting_type_durations(id) on delete restrict,
  add column if not exists created_by_admin_id uuid references admins(id) on delete set null;

alter table requests alter column meeting_type drop not null;

-- 7. Seed the two existing meeting types, their durations, roles, and pools.
--    Everything is created only when the meeting type row is newly inserted. If a type with the
--    same slug already exists (a re-run, or an admin has since reshaped it), nothing is touched,
--    so a second run never undoes admin edits.
--    In-depth pool   = professionals whose tier is in_depth.
--    Short-form pool = every professional (any tier).
--    tier::text works whether the live column is an enum or text. The tier column is not altered.
do $$
declare
  seed record;
  v_type_id uuid;
begin
  for seed in
    select * from (values
      ('In-depth meeting',   'in-depth',   75, true),
      ('Short-form meeting', 'short-form', 45, false)
    ) as s(title, slug, minutes, in_depth_only)
  loop
    v_type_id := null;

    insert into meeting_types (title, slug, is_active)
    values (seed.title, seed.slug, false)
    on conflict (slug) do nothing
    returning id into v_type_id;

    if v_type_id is null then
      continue;
    end if;

    insert into meeting_type_durations (meeting_type_id, label, minutes, sort_order)
    values (v_type_id, 'Standard', seed.minutes, 0);

    insert into meeting_type_roles (meeting_type_id, name, required_count, sort_order)
    values (v_type_id, 'Lead', 1, 0), (v_type_id, 'Support', 1, 1);

    insert into meeting_type_pool (meeting_type_id, professional_id)
    select v_type_id, p.id
    from professionals p
    where (not seed.in_depth_only) or p.tier::text = 'in_depth';

    insert into meeting_type_pool_roles (meeting_type_id, professional_id, role_id)
    select pool.meeting_type_id, pool.professional_id, r.id
    from meeting_type_pool pool
    join meeting_type_roles r on r.meeting_type_id = pool.meeting_type_id
    where pool.meeting_type_id = v_type_id;
  end loop;
end $$;

-- 8. Backfill requests that still use the old text value (none expected)
update requests r
set meeting_type_id = mt.id
from meeting_types mt
where r.meeting_type_id is null
  and r.meeting_type is not null
  and ((r.meeting_type = 'in_depth' and mt.slug = 'in-depth')
    or (r.meeting_type = 'short_form' and mt.slug = 'short-form'));

-- 9. Row level security: server (service role) only on the five new tables
alter table meeting_types            enable row level security;
alter table meeting_type_durations   enable row level security;
alter table meeting_type_roles       enable row level security;
alter table meeting_type_pool        enable row level security;
alter table meeting_type_pool_roles  enable row level security;

drop policy if exists meeting_types_service_role_all           on meeting_types;
drop policy if exists meeting_type_durations_service_role_all  on meeting_type_durations;
drop policy if exists meeting_type_roles_service_role_all      on meeting_type_roles;
drop policy if exists meeting_type_pool_service_role_all       on meeting_type_pool;
drop policy if exists meeting_type_pool_roles_service_role_all on meeting_type_pool_roles;

create policy meeting_types_service_role_all on meeting_types
  for all to service_role using (true) with check (true);
create policy meeting_type_durations_service_role_all on meeting_type_durations
  for all to service_role using (true) with check (true);
create policy meeting_type_roles_service_role_all on meeting_type_roles
  for all to service_role using (true) with check (true);
create policy meeting_type_pool_service_role_all on meeting_type_pool
  for all to service_role using (true) with check (true);
create policy meeting_type_pool_roles_service_role_all on meeting_type_pool_roles
  for all to service_role using (true) with check (true);

-- 10. professionals: remove the policy that allowed every role (Sprint 005), keep server-only access
alter table professionals enable row level security;
drop policy if exists "service all" on professionals;
-- "service role full access" (Phase 1 SQL) is tied to the public role and only restricted by a
-- condition. The server-only policy below replaces it, so no policy on professionals applies to
-- anon, authenticated, or public any more (Sprint 008 acceptance criterion 7). The app uses the
-- service role key, which bypasses row level security, so this does not affect the app.
drop policy if exists "service role full access" on professionals;
drop policy if exists professionals_service_role_all on professionals;
create policy professionals_service_role_all on professionals
  for all to service_role using (true) with check (true);
-- The post-check lists every remaining policy on professionals and flags any not limited to
-- the service_role role.

commit;
