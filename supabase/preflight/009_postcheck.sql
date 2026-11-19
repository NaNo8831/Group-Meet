-- Sprint 009 POST-CHECK (read-only)
-- Run in the Supabase SQL Editor AFTER applying 009_requests_new_model.sql (and again after a second run).
-- It only reads. Send all result sets back. Run each numbered query on its own if the editor
-- only shows the last result.

-- 1. The two links are required (expect is_nullable = NO on both)
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'requests'
  and column_name in ('meeting_type_id', 'duration_id')
order by column_name;

-- 2. Foreign keys on requests (expect the composite key; expect NO single-column duration_id key)
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = to_regclass('public.requests') and contype = 'f'
order by conname;
-- Expect: requests_duration_meeting_type_fkey = FOREIGN KEY (duration_id, meeting_type_id)
--         REFERENCES meeting_type_durations(id, meeting_type_id) ON DELETE RESTRICT
-- Expect: a meeting_type_id key to meeting_types, and NO requests_duration_id_fkey.

-- 3. The durations unique pair that the composite key points at (expect 1 row)
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = to_regclass('public.meeting_type_durations')
  and conname = 'meeting_type_durations_id_meeting_type_id_key';

-- 4. slots refuses a duplicate start within a request (expect 1 row, a unique index)
select indexname, indexdef
from pg_indexes
where schemaname = 'public' and tablename = 'slots' and indexname = 'slots_request_id_starts_at_key';

-- 5. Policies on requests and slots (expect only service_role)
select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public' and tablename in ('requests', 'slots')
order by tablename, policyname;

-- 5b. Any policy on those tables NOT limited to service_role (expect 0 rows)
select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('requests', 'slots')
  and not (roles = '{service_role}'::name[]);

-- 5c. Row level security is on (expect true on both)
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where oid in (to_regclass('public.requests'), to_regclass('public.slots'));

-- 6. Row counts (nothing should have changed from the preflight)
select 'requests' as what, count(*)::bigint as n from requests
union all select 'slots', count(*) from slots;

-- 7. How a mismatched duration is blocked (rule inspection; nothing is inserted).
--    The composite foreign key in query 2 is what makes a request with one meeting type's id and
--    another meeting type's duration id fail.
