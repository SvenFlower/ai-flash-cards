-- migration: enable authentication-based RLS policies
-- purpose: update RLS policies to use auth.uid() for user isolation
-- affected tables: flash_cards, sessions
-- special considerations:
--   - drops existing permissive policies
--   - adds user_id based restrictions
--   - authenticated users can only access their own data

-- ============================================================================
-- drop existing permissive policies for sessions table
-- ============================================================================

drop policy if exists "allow anon select on sessions" on public.sessions;
drop policy if exists "allow authenticated select on sessions" on public.sessions;
drop policy if exists "allow anon insert on sessions" on public.sessions;
drop policy if exists "allow authenticated insert on sessions" on public.sessions;
drop policy if exists "allow anon update on sessions" on public.sessions;
drop policy if exists "allow authenticated update on sessions" on public.sessions;
drop policy if exists "allow anon delete on sessions" on public.sessions;
drop policy if exists "allow authenticated delete on sessions" on public.sessions;

-- ============================================================================
-- create new auth-based policies for sessions table
-- ============================================================================

-- rls policy: allow authenticated users to select only their own sessions
-- rationale: users should only see their own sessions for privacy
create policy "users can select own sessions"
  on public.sessions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: allow authenticated users to insert sessions with their user_id
-- rationale: ensure user_id is automatically set to the authenticated user
create policy "users can insert own sessions"
  on public.sessions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- rls policy: allow authenticated users to update only their own sessions
-- rationale: users should only be able to modify their own sessions
create policy "users can update own sessions"
  on public.sessions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- rls policy: allow authenticated users to delete only their own sessions
-- rationale: users should only be able to delete their own sessions
create policy "users can delete own sessions"
  on public.sessions
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================================
-- drop existing permissive policies for flash_cards table
-- ============================================================================

drop policy if exists "allow anon select on flash_cards" on public.flash_cards;
drop policy if exists "allow authenticated select on flash_cards" on public.flash_cards;
drop policy if exists "allow anon insert on flash_cards" on public.flash_cards;
drop policy if exists "allow authenticated insert on flash_cards" on public.flash_cards;
drop policy if exists "allow anon update on flash_cards" on public.flash_cards;
drop policy if exists "allow authenticated update on flash_cards" on public.flash_cards;
drop policy if exists "allow anon delete on flash_cards" on public.flash_cards;
drop policy if exists "allow authenticated delete on flash_cards" on public.flash_cards;

-- ============================================================================
-- create new auth-based policies for flash_cards table
-- ============================================================================

-- rls policy: allow authenticated users to select only their own flash cards
-- rationale: users should only see their own flash cards for privacy
create policy "users can select own flash_cards"
  on public.flash_cards
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: allow authenticated users to insert flash cards with their user_id
-- rationale: ensure user_id is automatically set to the authenticated user
create policy "users can insert own flash_cards"
  on public.flash_cards
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- rls policy: allow authenticated users to update only their own flash cards
-- rationale: users should only be able to modify their own flash cards
create policy "users can update own flash_cards"
  on public.flash_cards
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- rls policy: allow authenticated users to delete only their own flash cards
-- rationale: users should only be able to delete their own flash cards
create policy "users can delete own flash_cards"
  on public.flash_cards
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================================
-- helper comment
-- ============================================================================
-- note: user_id will need to be set in application code when creating records
-- the with check clause ensures that users can only create records with their own user_id
