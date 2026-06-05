create extension if not exists pgcrypto;

create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role text not null check (role in ('leader', 'support')),
  is_active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  participant_name text not null,
  participant_email text not null,
  topic text not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled')),
  confirmed_leader_id uuid references team_members(id),
  confirmed_support_id uuid references team_members(id),
  created_at timestamptz default now()
);

create table if not exists time_slots (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz default now(),
  check (ends_at > starts_at)
);

alter table meetings
  add column if not exists confirmed_slot_id uuid references time_slots(id);

create table if not exists responses (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  slot_id uuid not null references time_slots(id) on delete cascade,
  team_member_id uuid not null references team_members(id),
  created_at timestamptz default now(),
  unique(team_member_id, slot_id)
);

alter table team_members enable row level security;
alter table meetings enable row level security;
alter table time_slots enable row level security;
alter table responses enable row level security;

drop policy if exists "public read active" on team_members;
create policy "public read active" on team_members
  for select
  using (is_active = true);

drop policy if exists "public insert" on meetings;
create policy "public insert" on meetings
  for insert
  with check (true);

drop policy if exists "public read" on meetings;
create policy "public read" on meetings
  for select
  using (true);

drop policy if exists "service update" on meetings;
create policy "service update" on meetings
  for update
  using (true);

drop policy if exists "public insert" on time_slots;
create policy "public insert" on time_slots
  for insert
  with check (true);

drop policy if exists "public read" on time_slots;
create policy "public read" on time_slots
  for select
  using (true);

drop policy if exists "public insert" on responses;
create policy "public insert" on responses
  for insert
  with check (true);

drop policy if exists "public read" on responses;
create policy "public read" on responses
  for select
  using (true);

create index if not exists idx_time_slots_meeting_starts_at
  on time_slots(meeting_id, starts_at);

create index if not exists idx_responses_meeting_slot
  on responses(meeting_id, slot_id);
