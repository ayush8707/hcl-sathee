-- ============================================================================
-- Security fix: switch on Row Level Security (RLS) for every table.
--
-- Why: Supabase's "anon" key is public by design. With RLS off, anyone who has
-- the project URL and that key can read every table (including password
-- hashes) and change rows, e.g. make themselves an admin.
--
-- Effect: with RLS on and no policies, the anon and authenticated keys can no
-- longer read or change anything. The Node server is unaffected because it
-- connects with the service_role key, which always bypasses RLS. The website
-- never talks to Supabase directly, so nothing in the app changes.
--
-- Run once in Supabase -> SQL Editor. Safe to re-run.
--
-- BEFORE running, make sure Render's SUPABASE_SERVICE_ROLE_KEY really is the
-- "service_role" key (Supabase -> Project Settings -> API keys), not the
-- "anon" key; otherwise the server would be locked out too.
--
-- Undo (only if something stops working):
--   do $$ declare t record; begin
--     for t in select tablename from pg_tables where schemaname = 'public' loop
--       execute format('alter table public.%I disable row level security', t.tablename);
--     end loop; end $$;
-- ============================================================================

do $$
declare
  t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;

-- Quick check: every row below should show rls_enabled = true.
select tablename, rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
order by tablename;
