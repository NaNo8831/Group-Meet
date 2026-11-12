-- Sprint 008 PREFLIGHT (read-only)
-- Run this in the Supabase SQL Editor BEFORE applying 008_meeting_types.sql.
-- It only reads. It changes nothing. Send all result sets back to the Builder/Architect.
-- Run each numbered query on its own if the editor only shows the last result.

-- 1. Which of the relevant tables exist?
select t.name as table_name,
       (to_regclass('public.' || t.name) is not null) as exists_now
from (values
  ('professionals'), ('requests'), ('slots'), ('admins'),
  ('meeting_types'), ('meeting_type_durations'), ('meeting_type_roles'),
  ('meeting_type_pool'), ('meeting_type_pool_roles')
) as t(name)
order by t.name;

-- 2. professionals.tier: data type and default
select column_name, data_type, udt_name, column_default, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'professionals' and column_name = 'tier';

-- 2b. Check constraints on professionals
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = to_regclass('public.professionals') and contype = 'c';

-- 3. Policies on professionals, requests, and admins
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename in ('professionals', 'requests', 'admins')
order by tablename, policyname;

-- 3b. Is row level security enabled on those tables?
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where oid in (
  to_regclass('public.professionals'), to_regclass('public.requests'), to_regclass('public.admins')
);

-- 4. Row counts
select 'professionals total' as what, count(*)::bigint as n from professionals
union all select 'professionals active', count(*) from professionals where is_active
union all select 'professionals tier in_depth', count(*) from professionals where tier::text = 'in_depth'
union all select 'professionals tier general', count(*) from professionals where tier::text = 'general'
union all select 'requests', count(*) from requests
union all select 'admins admin', count(*) from admins where role::text = 'admin'
union all select 'admins super_admin', count(*) from admins where role::text = 'super_admin';

-- 5. Columns of requests
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'requests'
order by ordinal_position;
