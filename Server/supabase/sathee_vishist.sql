-- ============================================================================
-- SATHEE VISHIST as its own role.
--
-- Run once in Supabase -> SQL Editor. Safe to re-run.
--
-- 1. Adds a "subject" column to users (the subject a Vishist teaches).
-- 2. Turns every existing Vishist (a SATHEE MITRA with the "Is Vishist?" tick)
--    into the SATHEE VISHIST role. Their visit days and past visits are kept.
--    From now on they don't log in: the Kendra's SATHEE MITRA records visits.
-- ============================================================================

alter table users add column if not exists subject text;

update users
set role = 'SATHEE VISHIST', is_vishist = null, password = null
where upper(role) = 'SATHEE MITRA' and is_vishist = true;

-- Check: every Vishist, with their Kendra and visit days.
select name, centre, available_days, subject
from users
where role = 'SATHEE VISHIST'
order by centre, name;
