-- Sprint 009 PREFLIGHT (read-only)
-- Run in the Supabase SQL Editor BEFORE applying 009_requests_new_model.sql.
-- It only reads. It changes nothing. Send all result sets back to the Builder/Architect.
-- Run each numbered query on its own if the editor only shows the last result.

-- 1. Row counts
select 'requests' as what, count(*)::bigint as n from requests
union all select 'slots', count(*) from slots
union all select 'meeting_types active', count(*) from meeting_types where is_active
union all select 'meeting_types inactive', count(*) from meeting_types where not is_active
union all select 'meeting_type_durations', count(*) from meeting_type_durations;

-- 2. requests rows missing the new links (must be 0 or the migration stops)
select count(*)::bigint as requests_missing_links
from requests
where meeting_type_id is null or duration_id is null;

-- 3. Constraints on requests and slots (foreign keys, uniques, checks)
select conrelid::regclass as on_table, conname, contype, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid in (to_regclass('public.requests'), to_regclass('public.slots'))
order by conrelid::regclass::text, conname;

-- 4. Policies on requests and slots
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename in ('requests', 'slots')
order by tablename, policyname;

-- 4b. Is row level security on?
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where oid in (to_regclass('public.requests'), to_regclass('public.slots'));

-- 5. Unique constraints and indexes on meeting_type_durations
select indexname, indexdef
from pg_indexes
where schemaname = 'public' and tablename = 'meeting_type_durations'
order by indexname;

-- 6. The business time zone setting
select key, value
from platform_settings
where key = 'business_timezone';

-- 7. Existing indexes on requests and slots
select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public' and tablename in ('requests', 'slots')
order by tablename, indexname;
