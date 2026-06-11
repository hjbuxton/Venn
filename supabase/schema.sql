-- ============================================================================
-- Venn MVP — Database schema
-- Run this entire file in the Supabase SQL Editor (Project > SQL Editor).
-- Safe to re-run: uses "if not exists" / "or replace" where possible.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

-- Mirrors auth.users with the public profile fields we need everywhere else.
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organiser_id uuid not null references public.users (id) on delete cascade,
  travel_window jsonb, -- { "from": "yyyy-mm-dd", "to": "yyyy-mm-dd" }
  group_size int not null check (group_size > 0),
  invite_code text not null unique,
  status text not null default 'collecting'
    check (status in ('collecting', 'ready', 'planned')),
  created_at timestamptz not null default now()
);

create table if not exists public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  preferences_submitted boolean not null default false,
  unique (trip_id, user_id)
);

-- Private per-person preferences. RLS below ensures only the owner can ever
-- read their own row. Aggregation for the AI happens via a SECURITY DEFINER
-- function that strips identity before returning data.
create table if not exists public.preferences (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  budget_range text not null
    check (budget_range in ('under_300', '300_500', '500_800', '800_1200', '1200_plus')),
  available_dates jsonb not null, -- { "from": "yyyy-mm-dd", "to": "yyyy-mm-dd" }
  trip_vibes text[] not null default '{}'
    check (trip_vibes <@ array['beach','city','party','chill','adventure','culture']::text[]),
  deal_breakers text,
  distance text not null check (distance in ('uk', 'europe', 'anywhere')),
  created_at timestamptz not null default now(),
  unique (trip_id, user_id)
);

create table if not exists public.venn_recommendations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  triggered_by uuid not null references public.users (id) on delete cascade,
  recommendations_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  content text not null,
  message_type text not null default 'text'
    check (message_type in ('text', 'venn_card', 'system')),
  recommendation_id uuid references public.venn_recommendations (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists trip_members_trip_id_idx on public.trip_members (trip_id);
create index if not exists trip_members_user_id_idx on public.trip_members (user_id);
create index if not exists preferences_trip_id_idx on public.preferences (trip_id);
create index if not exists messages_trip_id_idx on public.messages (trip_id, created_at);
create index if not exists venn_recommendations_trip_id_idx on public.venn_recommendations (trip_id);

-- ----------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER — bypass RLS internally, used to avoid
-- recursive policy checks and to expose only safe, narrow data).
-- ----------------------------------------------------------------------------

create or replace function public.is_trip_member(p_trip_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = p_trip_id and user_id = auth.uid()
  );
$$;

create or replace function public.shares_trip_with(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.trip_members tm1
    join public.trip_members tm2 on tm1.trip_id = tm2.trip_id
    where tm1.user_id = auth.uid() and tm2.user_id = p_user_id
  );
$$;

-- ----------------------------------------------------------------------------
-- New user provisioning: copy auth.users -> public.users on signup.
-- ----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Trip status: flip to 'ready' once everyone has submitted preferences.
-- ----------------------------------------------------------------------------

create or replace function public.check_trip_ready()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip_id uuid;
  v_group_size int;
  v_submitted_count int;
begin
  v_trip_id := new.trip_id;

  select group_size into v_group_size from public.trips where id = v_trip_id;

  select count(*) into v_submitted_count
  from public.trip_members
  where trip_id = v_trip_id and preferences_submitted = true;

  if v_submitted_count >= v_group_size then
    update public.trips set status = 'ready' where id = v_trip_id and status = 'collecting';
  else
    update public.trips set status = 'collecting' where id = v_trip_id and status = 'ready';
  end if;

  return new;
end;
$$;

drop trigger if exists on_trip_member_change on public.trip_members;
create trigger on_trip_member_change
  after insert or update of preferences_submitted on public.trip_members
  for each row execute procedure public.check_trip_ready();

-- ----------------------------------------------------------------------------
-- Join flow: look up a trip by invite code (preview before joining), and
-- join a trip by invite code (adds the caller to trip_members).
-- ----------------------------------------------------------------------------

create or replace function public.get_trip_by_invite_code(p_invite_code text)
returns table (
  id uuid,
  name text,
  travel_window jsonb,
  group_size int,
  status text,
  member_count bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    t.id,
    t.name,
    t.travel_window,
    t.group_size,
    t.status,
    (select count(*) from public.trip_members tm where tm.trip_id = t.id) as member_count
  from public.trips t
  where t.invite_code = upper(p_invite_code);
$$;

create or replace function public.join_trip_by_invite_code(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip record;
  v_member_count int;
begin
  select * into v_trip from public.trips where invite_code = upper(p_invite_code);

  if not found then
    raise exception 'Invalid invite code';
  end if;

  select count(*) into v_member_count from public.trip_members where trip_id = v_trip.id;

  if v_member_count >= v_trip.group_size
     and not exists (
       select 1 from public.trip_members
       where trip_id = v_trip.id and user_id = auth.uid()
     )
  then
    raise exception 'This trip is already full';
  end if;

  insert into public.trip_members (trip_id, user_id)
  values (v_trip.id, auth.uid())
  on conflict (trip_id, user_id) do nothing;

  return v_trip.id;
end;
$$;

-- ----------------------------------------------------------------------------
-- AI aggregation: returns ANONYMISED preferences for a trip (no user_id),
-- only to a caller who is themselves a member of that trip.
-- ----------------------------------------------------------------------------

create or replace function public.get_trip_preferences_for_ai(p_trip_id uuid)
returns table (
  budget_range text,
  available_dates jsonb,
  trip_vibes text[],
  deal_breakers text,
  distance text
)
language sql
security definer
set search_path = public
stable
as $$
  select p.budget_range, p.available_dates, p.trip_vibes, p.deal_breakers, p.distance
  from public.preferences p
  where p.trip_id = p_trip_id
    and public.is_trip_member(p_trip_id);
$$;

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------

alter table public.users enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.preferences enable row level security;
alter table public.messages enable row level security;
alter table public.venn_recommendations enable row level security;

-- users: see your own profile, or profiles of people you share a trip with.
drop policy if exists "users_select" on public.users;
create policy "users_select" on public.users
  for select using (id = auth.uid() or public.shares_trip_with(id));

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update using (id = auth.uid()) with check (id = auth.uid());

-- trips: members (and the organiser) can view; only the organiser can update.
drop policy if exists "trips_select" on public.trips;
create policy "trips_select" on public.trips
  for select using (public.is_trip_member(id) or organiser_id = auth.uid());

drop policy if exists "trips_insert" on public.trips;
create policy "trips_insert" on public.trips
  for insert with check (organiser_id = auth.uid());

drop policy if exists "trips_update_organiser" on public.trips;
create policy "trips_update_organiser" on public.trips
  for update using (organiser_id = auth.uid()) with check (organiser_id = auth.uid());

-- trip_members: members can see the roster; users can add/update only themselves.
drop policy if exists "trip_members_select" on public.trip_members;
create policy "trip_members_select" on public.trip_members
  for select using (public.is_trip_member(trip_id));

drop policy if exists "trip_members_insert_self" on public.trip_members;
create policy "trip_members_insert_self" on public.trip_members
  for insert with check (user_id = auth.uid());

drop policy if exists "trip_members_update_self" on public.trip_members;
create policy "trip_members_update_self" on public.trip_members
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- preferences: PRIVATE. Only the owner can read, write, or update their own row.
drop policy if exists "preferences_select_own" on public.preferences;
create policy "preferences_select_own" on public.preferences
  for select using (user_id = auth.uid());

drop policy if exists "preferences_insert_own" on public.preferences;
create policy "preferences_insert_own" on public.preferences
  for insert with check (user_id = auth.uid() and public.is_trip_member(trip_id));

drop policy if exists "preferences_update_own" on public.preferences;
create policy "preferences_update_own" on public.preferences
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- messages: trip members can read all messages and post as themselves.
drop policy if exists "messages_select" on public.messages;
create policy "messages_select" on public.messages
  for select using (public.is_trip_member(trip_id));

drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert" on public.messages
  for insert with check (public.is_trip_member(trip_id) and user_id = auth.uid());

-- venn_recommendations: trip members can read; insert must be by a member.
drop policy if exists "venn_recommendations_select" on public.venn_recommendations;
create policy "venn_recommendations_select" on public.venn_recommendations
  for select using (public.is_trip_member(trip_id));

drop policy if exists "venn_recommendations_insert" on public.venn_recommendations;
create policy "venn_recommendations_insert" on public.venn_recommendations
  for insert with check (public.is_trip_member(trip_id) and triggered_by = auth.uid());

-- ----------------------------------------------------------------------------
-- Realtime: ensure messages stream to clients via Supabase Realtime.
-- ----------------------------------------------------------------------------

alter publication supabase_realtime add table public.messages;

-- ----------------------------------------------------------------------------
-- Permissions: allow the anon/authenticated roles to call our RPC helpers.
-- ----------------------------------------------------------------------------

grant execute on function public.get_trip_by_invite_code(text) to authenticated, anon;
grant execute on function public.join_trip_by_invite_code(text) to authenticated;
grant execute on function public.get_trip_preferences_for_ai(uuid) to authenticated;
grant execute on function public.is_trip_member(uuid) to authenticated;
grant execute on function public.shares_trip_with(uuid) to authenticated;
