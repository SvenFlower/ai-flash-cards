-- migration: initial schema for flash cards and sessions
-- purpose: create tables for storing flash cards organized into sessions
-- affected tables: flash_cards, sessions
-- special considerations:
--   - RLS enabled for multi-user support (future authentication)
--   - session_id is optional to support standalone cards
--   - sessions track creation and update timestamps

-- ============================================================================
-- sessions table
-- ============================================================================
-- stores user-created sessions (groups) of flash cards
-- default naming: "Sesja YYYY-MM-DD" but user can rename

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),

  -- future: user_id uuid references auth.users(id) on delete cascade,
  -- for MVP, user_id is null until authentication is implemented
  user_id uuid default null,

  -- session name, e.g., "Sesja 2024-12-14" or custom name
  name text not null,

  -- timestamps for tracking session lifecycle
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- create index on user_id for efficient queries when auth is added
create index if not exists sessions_user_id_idx on public.sessions(user_id);

-- create index on created_at for sorting sessions by date
create index if not exists sessions_created_at_idx on public.sessions(created_at desc);

-- enable row level security
alter table public.sessions enable row level security;

-- rls policy: allow anonymous users to select all sessions (MVP behavior)
-- rationale: during MVP, all users can see all sessions until auth is implemented
create policy "allow anon select on sessions"
  on public.sessions
  for select
  to anon
  using (true);

-- rls policy: allow authenticated users to select all sessions
-- rationale: future-proofing for when auth is implemented
create policy "allow authenticated select on sessions"
  on public.sessions
  for select
  to authenticated
  using (true);

-- rls policy: allow anonymous users to insert sessions
-- rationale: during MVP, any user can create sessions
create policy "allow anon insert on sessions"
  on public.sessions
  for insert
  to anon
  with check (true);

-- rls policy: allow authenticated users to insert sessions
-- rationale: future-proofing for when auth is implemented
create policy "allow authenticated insert on sessions"
  on public.sessions
  for insert
  to authenticated
  with check (true);

-- rls policy: allow anonymous users to update sessions
-- rationale: during MVP, any user can rename/update sessions
create policy "allow anon update on sessions"
  on public.sessions
  for update
  to anon
  using (true)
  with check (true);

-- rls policy: allow authenticated users to update sessions
-- rationale: future-proofing for when auth is implemented
create policy "allow authenticated update on sessions"
  on public.sessions
  for update
  to authenticated
  using (true)
  with check (true);

-- rls policy: allow anonymous users to delete sessions
-- rationale: during MVP, any user can delete sessions
create policy "allow anon delete on sessions"
  on public.sessions
  for delete
  to anon
  using (true);

-- rls policy: allow authenticated users to delete sessions
-- rationale: future-proofing for when auth is implemented
create policy "allow authenticated delete on sessions"
  on public.sessions
  for delete
  to authenticated
  using (true);

-- ============================================================================
-- flash_cards table
-- ============================================================================
-- stores individual flash cards with optional session association

create table if not exists public.flash_cards (
  id uuid primary key default gen_random_uuid(),

  -- future: user_id uuid references auth.users(id) on delete cascade,
  -- for MVP, user_id is null until authentication is implemented
  user_id uuid default null,

  -- optional reference to session (null for standalone cards)
  session_id uuid references public.sessions(id) on delete cascade,

  -- flash card content
  front text not null,
  back text not null,

  -- timestamp for tracking card creation
  created_at timestamptz not null default now()
);

-- create index on user_id for efficient queries when auth is added
create index if not exists flash_cards_user_id_idx on public.flash_cards(user_id);

-- create index on session_id for efficient retrieval of cards by session
create index if not exists flash_cards_session_id_idx on public.flash_cards(session_id);

-- create index on created_at for sorting cards by date
create index if not exists flash_cards_created_at_idx on public.flash_cards(created_at desc);

-- enable row level security
alter table public.flash_cards enable row level security;

-- rls policy: allow anonymous users to select all flash cards (MVP behavior)
-- rationale: during MVP, all users can see all flash cards until auth is implemented
create policy "allow anon select on flash_cards"
  on public.flash_cards
  for select
  to anon
  using (true);

-- rls policy: allow authenticated users to select all flash cards
-- rationale: future-proofing for when auth is implemented
create policy "allow authenticated select on flash_cards"
  on public.flash_cards
  for select
  to authenticated
  using (true);

-- rls policy: allow anonymous users to insert flash cards
-- rationale: during MVP, any user can create flash cards
create policy "allow anon insert on flash_cards"
  on public.flash_cards
  for insert
  to anon
  with check (true);

-- rls policy: allow authenticated users to insert flash cards
-- rationale: future-proofing for when auth is implemented
create policy "allow authenticated insert on flash_cards"
  on public.flash_cards
  for insert
  to authenticated
  with check (true);

-- rls policy: allow anonymous users to update flash cards
-- rationale: during MVP, any user can edit flash cards
create policy "allow anon update on flash_cards"
  on public.flash_cards
  for update
  to anon
  using (true)
  with check (true);

-- rls policy: allow authenticated users to update flash cards
-- rationale: future-proofing for when auth is implemented
create policy "allow authenticated update on flash_cards"
  on public.flash_cards
  for update
  to authenticated
  using (true)
  with check (true);

-- rls policy: allow anonymous users to delete flash cards
-- rationale: during MVP, any user can delete flash cards
create policy "allow anon delete on flash_cards"
  on public.flash_cards
  for delete
  to anon
  using (true);

-- rls policy: allow authenticated users to delete flash cards
-- rationale: future-proofing for when auth is implemented
create policy "allow authenticated delete on flash_cards"
  on public.flash_cards
  for delete
  to authenticated
  using (true);

-- ============================================================================
-- trigger: update sessions.updated_at on modification
-- ============================================================================
-- automatically update the updated_at timestamp when a session is modified

create or replace function public.update_sessions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_update_sessions_updated_at
  before update on public.sessions
  for each row
  execute function public.update_sessions_updated_at();
