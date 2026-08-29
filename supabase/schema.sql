-- =============================================================================
-- ParkPals — Supabase schema (pilot backend)
-- Run this whole file once in the Supabase SQL Editor (Dashboard → SQL → New query).
-- It is safe to re-run: everything uses "if not exists" / "or replace".
-- =============================================================================

-- ---- Extensions --------------------------------------------------------------
create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- =============================================================================
-- 1) profiles — one row per signed-in owner + their dog
--    id matches the Supabase Auth user id.
-- =============================================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  owner_name    text        not null default '',
  city          text        not null default '',
  neighborhood  text        not null default '',
  personal_code text        unique,            -- 4-char friend code, e.g. "4KD2"
  -- dog
  dog_name      text        not null default '',
  breed         text        not null default '',
  age_years     numeric     not null default 1,
  size          text        not null default 'medium',
  energy        text        not null default 'balanced',
  gender        text        not null default 'male',
  neutered      boolean     not null default false,
  photo         text        not null default '🐕',  -- emoji or data-url
  tricks        text[]      not null default '{}',
  treats        text[]      not null default '{}',
  toys          text[]      not null default '{}',
  favorites     text[]      not null default '{}',
  traits        text[]      not null default '{}',
  score         int         not null default 0,      -- happiness average (drives frame)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists profiles_personal_code_idx on public.profiles (personal_code);

-- =============================================================================
-- 2) presence — at most one active row per user (who is at / heading to a park)
--    park_id is the same string id used in the app's local PARKS list.
-- =============================================================================
create table if not exists public.presence (
  user_id         uuid primary key references public.profiles (id) on delete cascade,
  park_id         text        not null,
  kind            text        not null default 'at_park',  -- 'at_park' | 'heading'
  shares_location boolean     not null default false,
  started_at      timestamptz not null default now()
);

create index if not exists presence_park_idx on public.presence (park_id);

-- =============================================================================
-- 3) friend_links — directional: each side stores its own list + favorite flag
-- =============================================================================
create table if not exists public.friend_links (
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  friend_id  uuid        not null references public.profiles (id) on delete cascade,
  favorite   boolean     not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id)
);

-- =============================================================================
-- 4) messages — quick preset messages between two users
-- =============================================================================
create table if not exists public.messages (
  id         uuid        primary key default gen_random_uuid(),
  from_id    uuid        not null references public.profiles (id) on delete cascade,
  to_id      uuid        not null references public.profiles (id) on delete cascade,
  type       text        not null,   -- QuickMsgType, e.g. 'invite_walk'
  park_name  text,
  created_at timestamptz not null default now()
);

create index if not exists messages_to_idx   on public.messages (to_id, created_at desc);
create index if not exists messages_from_idx on public.messages (from_id, created_at desc);

-- =============================================================================
-- 5) complaints — park issue reports (national box)
-- =============================================================================
create table if not exists public.complaints (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        references public.profiles (id) on delete set null,
  park_name  text        not null,
  city       text        not null default '',
  category   text        not null default '',
  text       text        not null default '',
  created_at timestamptz not null default now()
);

-- =============================================================================
-- Row Level Security — lock every table, then open only what the pilot needs.
-- =============================================================================
alter table public.profiles     enable row level security;
alter table public.presence     enable row level security;
alter table public.friend_links enable row level security;
alter table public.messages     enable row level security;
alter table public.complaints   enable row level security;

-- ---- profiles ----------------------------------------------------------------
-- Any signed-in user can read profiles (needed to look up a friend by code and
-- to show friends' dogs). Each user may write only their own row.
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select to authenticated using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ---- presence ----------------------------------------------------------------
-- Everyone signed in can see who is at a park; you write only your own presence.
drop policy if exists presence_read on public.presence;
create policy presence_read on public.presence
  for select to authenticated using (true);

drop policy if exists presence_write_own on public.presence;
create policy presence_write_own on public.presence
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- friend_links ------------------------------------------------------------
-- You see and manage only your own links.
drop policy if exists friend_links_own on public.friend_links;
create policy friend_links_own on public.friend_links
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- messages ----------------------------------------------------------------
-- You read messages you sent or received; you may send only as yourself.
drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages
  for select to authenticated using (from_id = auth.uid() or to_id = auth.uid());

drop policy if exists messages_send on public.messages;
create policy messages_send on public.messages
  for insert to authenticated with check (from_id = auth.uid());

-- ---- complaints --------------------------------------------------------------
-- You may file a complaint as yourself; reads are not exposed to clients.
drop policy if exists complaints_insert on public.complaints;
create policy complaints_insert on public.complaints
  for insert to authenticated with check (user_id = auth.uid());

-- =============================================================================
-- Realtime — stream presence + messages changes to subscribed clients.
-- =============================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'presence'
  ) then
    alter publication supabase_realtime add table public.presence;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- =============================================================================
-- Auto-create a blank profile the moment a user signs up, so the app always
-- has a row to fill in during onboarding.
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- Done. Next: enable Email auth (Authentication → Providers → Email) and add
-- your site URL under Authentication → URL Configuration → Redirect URLs.
-- =============================================================================
