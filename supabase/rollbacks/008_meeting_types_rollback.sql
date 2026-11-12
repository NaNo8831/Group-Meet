-- Sprint 008 ROLLBACK
-- Only run this if you decide to undo migration 008. It DELETES the meeting type tables and all
-- data in them (including any meeting types, durations, roles, and pools admins created).
-- Run in the Supabase SQL Editor. Transaction-wrapped: it all happens or none of it does.

begin;

-- 1. requests: remove the three Sprint 008 columns
alter table requests drop column if exists meeting_type_id;
alter table requests drop column if exists duration_id;
alter table requests drop column if exists created_by_admin_id;

-- 2. Restore NOT NULL on requests.meeting_type only if no row has it empty.
do $$
begin
  if exists (select 1 from requests where meeting_type is null) then
    raise notice 'requests.meeting_type left nullable: some rows have no value.';
  else
    alter table requests alter column meeting_type set not null;
  end if;
end $$;

-- 3. Drop the new tables (children first)
drop table if exists meeting_type_pool_roles;
drop table if exists meeting_type_pool;
drop table if exists meeting_type_roles;
drop table if exists meeting_type_durations;
drop table if exists meeting_types;

-- 4. professionals policies
-- This rollback intentionally does NOT recreate the old policy named "service all".
-- That policy allowed every role (not just the server) to read and write professionals,
-- which exposes names and emails to anyone holding the public key. The server-only policy
-- added by migration 008 (professionals_service_role_all) is left in place.

commit;
