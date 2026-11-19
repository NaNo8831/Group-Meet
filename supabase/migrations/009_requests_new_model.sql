-- Migration 009: requests and slots on the new meeting type model (Sprint 009)
-- Apply in the Supabase SQL Editor AFTER running supabase/preflight/009_preflight.sql.
-- Safe to run twice: every statement is guarded so a second run changes nothing.
-- Rollback: supabase/rollbacks/009_requests_new_model_rollback.sql
-- Check:    supabase/preflight/009_postcheck.sql

begin;

-- 0. Guard: the tables this migration depends on must exist, and no request may lack the new links.
do $$
begin
  if to_regclass('public.requests') is null then
    raise exception 'Migration 009 needs the requests table. Not found.';
  end if;
  if to_regclass('public.slots') is null then
    raise exception 'Migration 009 needs the slots table. Not found.';
  end if;
  if to_regclass('public.meeting_type_durations') is null then
    raise exception 'Migration 009 needs meeting_type_durations (migration 008). Not found.';
  end if;
  if exists (select 1 from requests where meeting_type_id is null or duration_id is null) then
    raise exception 'Some requests have no meeting_type_id or duration_id. Backfill them before applying migration 009.';
  end if;
end $$;

-- 1. A request's duration must belong to its meeting type: the durations table needs a unique
--    (id, meeting_type_id) pair for the composite foreign key below to point at.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.meeting_type_durations'::regclass
      and conname = 'meeting_type_durations_id_meeting_type_id_key'
  ) then
    alter table meeting_type_durations
      add constraint meeting_type_durations_id_meeting_type_id_key unique (id, meeting_type_id);
  end if;
end $$;

-- 2. The new links are required from now on.
alter table requests alter column meeting_type_id set not null;
alter table requests alter column duration_id set not null;

-- 3. Composite foreign key: (duration_id, meeting_type_id) must be a real duration of that type.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.requests'::regclass
      and conname = 'requests_duration_meeting_type_fkey'
  ) then
    alter table requests
      add constraint requests_duration_meeting_type_fkey
      foreign key (duration_id, meeting_type_id)
      references meeting_type_durations (id, meeting_type_id)
      on delete restrict;
  end if;
end $$;

-- The single-column foreign key on duration_id (created by migration 008) is now redundant and
-- would leave two competing relationships between the same two tables.
alter table requests drop constraint if exists requests_duration_id_fkey;

-- 4. A request cannot propose the same start twice.
create unique index if not exists slots_request_id_starts_at_key on slots (request_id, starts_at);

-- 5. Indexes for the admin list and lookups.
create index if not exists idx_requests_meeting_type on requests (meeting_type_id);
create index if not exists idx_requests_created_at   on requests (created_at desc);

-- 6. Row level security: server (service role) only on requests and slots.
alter table requests enable row level security;
alter table slots    enable row level security;

drop policy if exists "service role full access" on requests;
drop policy if exists "service role full access" on slots;
drop policy if exists requests_service_role_all on requests;
drop policy if exists slots_service_role_all    on slots;

create policy requests_service_role_all on requests
  for all to service_role using (true) with check (true);
create policy slots_service_role_all on slots
  for all to service_role using (true) with check (true);

commit;
