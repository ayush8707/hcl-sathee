-- ============================================================================
-- Platform views: browse each platform's data separately.
--
-- Run once in Supabase -> SQL Editor. Safe to re-run (also over the older
-- version of this file). It only CREATES VIEWS (saved, read-only queries); no
-- table or row is changed, and the app does not use these views.
--
-- To see them: Table Editor -> "schema" dropdown (top left) -> platform_views.
--
-- Platforms (same rule as the server, see Server/src/Utils/centreMatch.js):
--   * SATHEE Barmer   - a centre containing "BARMER"         -> barmer_* views
--   * SATHEE Kendras  - a centre starting with "SATHEE"      -> sathee_* views
--     (Delhi, Odisha, ... and any Kendra added on the SATHEE page; the
--     "kendra" column says which one)
--   * HCL SATHEE      - every other centre, including empty  -> hcl_* views
-- Admin accounts have no centre and are listed in platform_views.admins.
-- platform_views.summary has one row per Kendra with headline counts.
--
-- The views live in their own schema, which the public API cannot reach, and
-- the users views never include passwords or reset codes.
-- ============================================================================

create schema if not exists platform_views;

-- Only the database owner (you, in the dashboard) may use this schema.
revoke all on schema platform_views from public, anon, authenticated;

create or replace function platform_views.centre_key(centre text)
returns text
language sql
immutable
as $$
  select upper(regexp_replace(coalesce(centre, ''), '[^A-Za-z]', '', 'g'))
$$;

create or replace function platform_views.is_barmer(centre text)
returns boolean
language sql
immutable
as $$
  select platform_views.centre_key(centre) like '%BARMER%'
$$;

-- SATHEE Kendras other than Barmer: "SATHEE DELHI", "SATHEE ODISHA", ...
create or replace function platform_views.is_sathee_kendra(centre text)
returns boolean
language sql
immutable
as $$
  select platform_views.centre_key(centre) like 'SATHEE%'
     and not platform_views.is_barmer(centre)
$$;

create or replace function platform_views.is_hcl(centre text)
returns boolean
language sql
immutable
as $$
  select not platform_views.is_barmer(centre)
     and not platform_views.is_sathee_kendra(centre)
$$;

-- The platform (or, for SATHEE Kendras, the Kendra) a centre belongs to.
create or replace function platform_views.platform_of(centre text)
returns text
language sql
immutable
as $$
  select case
    when platform_views.is_barmer(centre) then 'SATHEE Barmer'
    when platform_views.is_sathee_kendra(centre)
      then 'SATHEE ' || initcap(btrim(regexp_replace(centre, '^\s*sathee\s*', '', 'i')))
    else 'HCL SATHEE'
  end
$$;

-- ---------------------------------------------------------------- users (no passwords / OTPs)
create or replace view platform_views.barmer_users with (security_invoker = true) as
  select id, name, email, phone, role, centre, is_vishist, available_days,
         last_login_at, created_at, updated_at
  from public.users
  where platform_views.is_barmer(centre);

create or replace view platform_views.hcl_users with (security_invoker = true) as
  select id, name, email, phone, role, centre, is_vishist, available_days,
         last_login_at, created_at, updated_at
  from public.users
  where platform_views.is_hcl(centre) and upper(role) <> 'ADMIN';

create or replace view platform_views.admins with (security_invoker = true) as
  select id, name, email, phone, role, last_login_at, created_at, updated_at
  from public.users
  where upper(role) = 'ADMIN';

-- ---------------------------------------------------------------- students
create or replace view platform_views.barmer_students with (security_invoker = true) as
  select * from public.students where platform_views.is_barmer(centre);

create or replace view platform_views.hcl_students with (security_invoker = true) as
  select * from public.students where platform_views.is_hcl(centre);

-- ---------------------------------------------------------------- tests and marks
create or replace view platform_views.barmer_tests with (security_invoker = true) as
  select * from public.tests where platform_views.is_barmer(centre);

create or replace view platform_views.hcl_tests with (security_invoker = true) as
  select * from public.tests where platform_views.is_hcl(centre);

create or replace view platform_views.barmer_test_marks with (security_invoker = true) as
  select * from public.test_subject_marks where platform_views.is_barmer(centre);

create or replace view platform_views.hcl_test_marks with (security_invoker = true) as
  select * from public.test_subject_marks where platform_views.is_hcl(centre);

-- ---------------------------------------------------------------- student attendance
create or replace view platform_views.barmer_student_attendance with (security_invoker = true) as
  select * from public.daily_subject_attendances where platform_views.is_barmer(centre);

create or replace view platform_views.hcl_student_attendance with (security_invoker = true) as
  select * from public.daily_subject_attendances where platform_views.is_hcl(centre);

-- Per-student rollups have no centre column; they follow the student's centre.
create or replace view platform_views.barmer_subject_attendance with (security_invoker = true) as
  select sa.*, s.student_id as student_code, s.name as student_name
  from public.subject_attendances sa
  join public.students s on s.id = sa.student_id
  where platform_views.is_barmer(s.centre);

create or replace view platform_views.hcl_subject_attendance with (security_invoker = true) as
  select sa.*, s.student_id as student_code, s.name as student_name
  from public.subject_attendances sa
  join public.students s on s.id = sa.student_id
  where platform_views.is_hcl(s.centre);

create or replace view platform_views.barmer_subject_performance with (security_invoker = true) as
  select sp.*, s.student_id as student_code, s.name as student_name
  from public.subject_performances sp
  join public.students s on s.id = sp.student_id
  where platform_views.is_barmer(s.centre);

create or replace view platform_views.hcl_subject_performance with (security_invoker = true) as
  select sp.*, s.student_id as student_code, s.name as student_name
  from public.subject_performances sp
  join public.students s on s.id = sp.student_id
  where platform_views.is_hcl(s.centre);

-- ---------------------------------------------------------------- mentor attendance
create or replace view platform_views.barmer_mitra_attendance with (security_invoker = true) as
  select * from public.mitra_attendances where platform_views.is_barmer(centre);

create or replace view platform_views.hcl_mitra_attendance with (security_invoker = true) as
  select * from public.mitra_attendances where platform_views.is_hcl(centre);

create or replace view platform_views.barmer_vishist_attendance with (security_invoker = true) as
  select * from public.vishist_attendances where platform_views.is_barmer(centre);

create or replace view platform_views.hcl_vishist_attendance with (security_invoker = true) as
  select * from public.vishist_attendances where platform_views.is_hcl(centre);

-- ---------------------------------------------------------------- announcements
-- An announcement belongs to a platform if its main centre or any extra centre does.
create or replace view platform_views.barmer_announcements with (security_invoker = true) as
  select * from public.announcements a
  where platform_views.is_barmer(a.centre)
     or exists (select 1 from unnest(coalesce(a.other_centres, '{}')) c where platform_views.is_barmer(c));

create or replace view platform_views.hcl_announcements with (security_invoker = true) as
  select * from public.announcements a
  where platform_views.is_hcl(a.centre)
     or exists (select 1 from unnest(coalesce(a.other_centres, '{}')) c where platform_views.is_hcl(c));

-- ---------------------------------------------------------------- equipment, leave, queries
create or replace view platform_views.barmer_equipment with (security_invoker = true) as
  select * from public.equipments where platform_views.is_barmer(centre);

create or replace view platform_views.hcl_equipment with (security_invoker = true) as
  select * from public.equipments where platform_views.is_hcl(centre);

create or replace view platform_views.barmer_leave_requests with (security_invoker = true) as
  select * from public.leave_requests where platform_views.is_barmer(centre);

create or replace view platform_views.hcl_leave_requests with (security_invoker = true) as
  select * from public.leave_requests where platform_views.is_hcl(centre);

create or replace view platform_views.barmer_queries with (security_invoker = true) as
  select * from public.support_queries where platform_views.is_barmer(centre);

create or replace view platform_views.hcl_queries with (security_invoker = true) as
  select * from public.support_queries where platform_views.is_hcl(centre);

-- ---------------------------------------------------------------- SATHEE Kendras
-- Same tables for the SATHEE Kendras (not Barmer); "kendra" says which one.
create or replace view platform_views.sathee_users with (security_invoker = true) as
  select platform_views.platform_of(centre) as kendra,
         id, name, email, phone, role, centre, is_vishist, available_days,
         last_login_at, created_at, updated_at
  from public.users
  where platform_views.is_sathee_kendra(centre);

create or replace view platform_views.sathee_students with (security_invoker = true) as
  select platform_views.platform_of(centre) as kendra, *
  from public.students where platform_views.is_sathee_kendra(centre);

create or replace view platform_views.sathee_tests with (security_invoker = true) as
  select platform_views.platform_of(centre) as kendra, *
  from public.tests where platform_views.is_sathee_kendra(centre);

create or replace view platform_views.sathee_test_marks with (security_invoker = true) as
  select platform_views.platform_of(centre) as kendra, *
  from public.test_subject_marks where platform_views.is_sathee_kendra(centre);

create or replace view platform_views.sathee_student_attendance with (security_invoker = true) as
  select platform_views.platform_of(centre) as kendra, *
  from public.daily_subject_attendances where platform_views.is_sathee_kendra(centre);

create or replace view platform_views.sathee_mitra_attendance with (security_invoker = true) as
  select platform_views.platform_of(centre) as kendra, *
  from public.mitra_attendances where platform_views.is_sathee_kendra(centre);

create or replace view platform_views.sathee_vishist_attendance with (security_invoker = true) as
  select platform_views.platform_of(centre) as kendra, *
  from public.vishist_attendances where platform_views.is_sathee_kendra(centre);

create or replace view platform_views.sathee_equipment with (security_invoker = true) as
  select platform_views.platform_of(centre) as kendra, *
  from public.equipments where platform_views.is_sathee_kendra(centre);

create or replace view platform_views.sathee_leave_requests with (security_invoker = true) as
  select platform_views.platform_of(centre) as kendra, *
  from public.leave_requests where platform_views.is_sathee_kendra(centre);

create or replace view platform_views.sathee_queries with (security_invoker = true) as
  select platform_views.platform_of(centre) as kendra, *
  from public.support_queries where platform_views.is_sathee_kendra(centre);

create or replace view platform_views.sathee_subject_attendance with (security_invoker = true) as
  select platform_views.platform_of(s.centre) as kendra,
         sa.*, s.student_id as student_code, s.name as student_name
  from public.subject_attendances sa
  join public.students s on s.id = sa.student_id
  where platform_views.is_sathee_kendra(s.centre);

create or replace view platform_views.sathee_subject_performance with (security_invoker = true) as
  select platform_views.platform_of(s.centre) as kendra,
         sp.*, s.student_id as student_code, s.name as student_name
  from public.subject_performances sp
  join public.students s on s.id = sp.student_id
  where platform_views.is_sathee_kendra(s.centre);

create or replace view platform_views.sathee_announcements with (security_invoker = true) as
  select * from public.announcements a
  where platform_views.is_sathee_kendra(a.centre)
     or exists (select 1 from unnest(coalesce(a.other_centres, '{}')) c where platform_views.is_sathee_kendra(c));

-- ---------------------------------------------------------------- summary
-- One row per platform / SATHEE Kendra with headline counts.
drop view if exists platform_views.summary;
create view platform_views.summary with (security_invoker = true) as
  select platform,
         count(*) filter (where kind = 'student')        as students,
         count(*) filter (where kind = 'SATHEE MITRA')   as sathee_mitras,
         count(*) filter (where kind = 'HCL PARTNER')    as partners,
         count(*) filter (where kind = 'query')          as queries,
         count(*) filter (where kind = 'leave')          as leave_requests
  from (
    select platform_views.platform_of(centre) as platform, 'student' as kind
      from public.students
    union all
    select platform_views.platform_of(centre), upper(role)
      from public.users where upper(role) <> 'ADMIN'
    union all
    select platform_views.platform_of(centre), 'query'
      from public.support_queries
    union all
    select platform_views.platform_of(centre), 'leave'
      from public.leave_requests
  ) rows
  group by platform
  order by platform = 'HCL SATHEE' desc, platform;

-- Keep the API roles out of everything created above.
revoke all on all tables in schema platform_views from public, anon, authenticated;
revoke all on all functions in schema platform_views from public, anon, authenticated;
