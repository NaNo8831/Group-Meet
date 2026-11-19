-- Sprint 009 ROLLBACK
-- Only run this if you decide to undo migration 009. Run in the Supabase SQL Editor.
-- Transaction-wrapped: it all happens or none of it does. It does not delete any rows.

begin;

-- 1. Drop the composite foreign key and restore the single-column one from migration 008.
alter table requests drop constraint if exists requests_duration_meeting_type_fkey;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.requests'::regclass
      and conname = 'requests_duration_id_fkey'
  ) then
    alter table requests
      add constraint requests_duration_id_fkey
      foreign key (duration_id) references meeting_type_durations (id) on delete restrict;
  end if;
end $$;

-- 2. The new links may be empty again.
alter table requests alter column meeting_type_id drop not null;
alter table requests alter column duration_id drop not null;

-- 3. Remove the unique pair added to meeting_type_durations by migration 009.
alter table meeting_type_durations
  drop constraint if exists meeting_type_durations_id_meeting_type_id_key;

-- 4. Remove the slots unique index and the two new indexes.
drop index if exists slots_request_id_starts_at_key;
drop index if exists idx_requests_meeting_type;
drop index if exists idx_requests_created_at;

-- 5. Policies
-- This rollback intentionally does NOT recreate the old "service role full access" policies on
-- requests and slots. They were tied to the public role (limited only by a condition). The
-- server-only policies added by migration 009 (requests_service_role_all, slots_service_role_all)
-- are left in place.

commit;
