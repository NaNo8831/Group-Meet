-- Sprint 008 POST-CHECK (read-only)
-- Run in the Supabase SQL Editor AFTER applying 008_meeting_types.sql (and again after a second run).
-- It only reads. Send all result sets back. Run each numbered query on its own if the editor
-- only shows the last result.

-- 1. The five new tables exist and row level security is on
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
where c.oid in (
  to_regclass('public.meeting_types'), to_regclass('public.meeting_type_durations'),
  to_regclass('public.meeting_type_roles'), to_regclass('public.meeting_type_pool'),
  to_regclass('public.meeting_type_pool_roles')
)
order by c.relname;
-- Expect 5 rows, all rls_enabled = true.

-- 2. Policies on the new tables and on professionals
select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('meeting_types', 'meeting_type_durations', 'meeting_type_roles',
                    'meeting_type_pool', 'meeting_type_pool_roles', 'professionals')
order by tablename, policyname;
-- Expect every row's roles to be {service_role}.

-- 2b. Any policy on those tables that is NOT limited to service_role (expect 0 rows)
select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('meeting_types', 'meeting_type_durations', 'meeting_type_roles',
                    'meeting_type_pool', 'meeting_type_pool_roles', 'professionals')
  and not (roles = '{service_role}'::name[]);
-- If this returns rows, tell the Architect: some policy still applies to anon, authenticated, or public.

-- 3. Seeded meeting types with durations, roles, and pool size (expect 2 rows)
select mt.slug, mt.title, mt.is_active, mt.min_matched_slots, mt.min_responses,
       (select string_agg(d.label || ' ' || d.minutes || 'min', ', ' order by d.sort_order)
          from meeting_type_durations d where d.meeting_type_id = mt.id) as durations,
       (select string_agg(r.name || ' x' || r.required_count, ', ' order by r.sort_order)
          from meeting_type_roles r where r.meeting_type_id = mt.id) as roles,
       (select count(*) from meeting_type_pool p where p.meeting_type_id = mt.id) as pool_size
from meeting_types mt
order by mt.slug;
-- Expect: in-depth (Standard 75min; Lead x1, Support x1; inactive), short-form (Standard 45min; same roles; inactive).

-- 4. In-depth pool versus professionals with tier in_depth (both counts must be 0)
select 'in pool but not tier in_depth' as what, count(*)::bigint as n
from meeting_type_pool p join meeting_types mt on mt.id = p.meeting_type_id and mt.slug = 'in-depth'
join professionals pr on pr.id = p.professional_id
where pr.tier::text <> 'in_depth'
union all
select 'tier in_depth but not in pool', count(*)
from professionals pr
where pr.tier::text = 'in_depth'
  and not exists (select 1 from meeting_type_pool p join meeting_types mt on mt.id = p.meeting_type_id and mt.slug = 'in-depth'
                  where p.professional_id = pr.id);

-- 5. Short-form pool versus all professionals (both counts must be 0)
select 'professional missing from short-form pool' as what, count(*)::bigint as n
from professionals pr
where not exists (select 1 from meeting_type_pool p join meeting_types mt on mt.id = p.meeting_type_id and mt.slug = 'short-form'
                  where p.professional_id = pr.id)
union all
select 'short-form pool entry without a professional', count(*)
from meeting_type_pool p join meeting_types mt on mt.id = p.meeting_type_id and mt.slug = 'short-form'
where not exists (select 1 from professionals pr where pr.id = p.professional_id);

-- 6. Every seeded pool entry has both roles (expect 0 rows listed)
select mt.slug, p.professional_id, count(pr.role_id) as roles_held
from meeting_type_pool p
join meeting_types mt on mt.id = p.meeting_type_id and mt.slug in ('in-depth', 'short-form')
left join meeting_type_pool_roles pr
  on pr.meeting_type_id = p.meeting_type_id and pr.professional_id = p.professional_id
group by mt.slug, p.professional_id
having count(pr.role_id) <> 2;

-- 7. Pool size comparison for the report
select mt.slug,
       (select count(*) from meeting_type_pool p where p.meeting_type_id = mt.id) as pool_size,
       (select count(*) from professionals where tier::text = 'in_depth') as pros_tier_in_depth,
       (select count(*) from professionals) as pros_total
from meeting_types mt
where mt.slug in ('in-depth', 'short-form')
order by mt.slug;

-- 8. requests: the three new columns exist and are nullable; meeting_type no longer required
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'requests'
  and column_name in ('meeting_type', 'meeting_type_id', 'duration_id', 'created_by_admin_id')
order by column_name;
-- Expect is_nullable = YES on all four.

-- 9. How a role from another meeting type is blocked (rule inspection, nothing is inserted)
select conrelid::regclass as on_table, conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = to_regclass('public.meeting_type_pool_roles') and contype = 'f'
order by conname;
-- Expect a foreign key (role_id, meeting_type_id) referencing meeting_type_roles (id, meeting_type_id).

-- 10. professionals.tier still has its default (the roster no longer sends a tier)
select column_name, data_type, udt_name, column_default, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'professionals' and column_name = 'tier';
-- Expect column_default to contain 'general'.
