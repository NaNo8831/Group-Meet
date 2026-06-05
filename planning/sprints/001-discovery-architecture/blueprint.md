# Sprint 001 — Blueprint

## Project Structure

```
app/
├── page.tsx                            # Participant request form
├── meetings/
│   └── [id]/
│       └── page.tsx                    # Participant status page
├── team/
│   └── meetings/
│       └── [id]/
│           └── page.tsx                # Team voting page
└── api/
    ├── meetings/
    │   └── route.ts                    # POST: create meeting
    └── responses/
        └── route.ts                    # POST: record vote + quorum

lib/
├── supabase.ts                         # Supabase clients (server + browser)
├── email.ts                            # Resend helpers
├── quorum.ts                           # Quorum check logic
└── types.ts                            # Shared TypeScript types

supabase/
├── schema.sql                          # All tables + RLS
└── seed.sql                            # Team member seed data

.env.example
```

---

## Database Schema

```sql
-- team_members
create table team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role text not null check (role in ('leader', 'support')),
  is_active boolean not null default true,
  created_at timestamptz default now()
);

-- meetings
create table meetings (
  id uuid primary key default gen_random_uuid(),
  participant_name text not null,
  participant_email text not null,
  topic text not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled')),
  confirmed_slot_id uuid references time_slots(id),
  confirmed_leader_id uuid references team_members(id),
  confirmed_support_id uuid references team_members(id),
  created_at timestamptz default now()
);

-- time_slots
create table time_slots (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz default now()
);

-- responses
create table responses (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  slot_id uuid not null references time_slots(id) on delete cascade,
  team_member_id uuid not null references team_members(id),
  created_at timestamptz default now(),
  unique(team_member_id, slot_id)
);
```

## RLS Policies

```sql
alter table meetings enable row level security;
create policy "public insert" on meetings for insert with check (true);
create policy "public read" on meetings for select using (true);
create policy "service update" on meetings for update using (true);

alter table time_slots enable row level security;
create policy "public insert" on time_slots for insert with check (true);
create policy "public read" on time_slots for select using (true);

alter table responses enable row level security;
create policy "public insert" on responses for insert with check (true);
create policy "public read" on responses for select using (true);

alter table team_members enable row level security;
create policy "public read active" on team_members for select using (is_active = true);
```

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
```

---

## API Route Logic

### POST `/api/meetings`
```typescript
// 1. Parse + validate body with zod
// 2. Insert into meetings
// 3. Insert all slots into time_slots
// 4. Fetch all active team_members
// 5. For each member: send team notification email via Resend
// 6. Return { meetingId }
```

### POST `/api/responses`
```typescript
// 1. Parse + validate body: { meetingId, slotIds: string[], teamMemberId }
// 2. Fetch meeting — return 409 if status !== 'pending'
// 3. Insert one response row per slotId (upsert on conflict)
// 4. Call checkQuorum(meetingId)
// 5. If quorum slot returned:
//    a. Update meeting: status='confirmed', confirmed_slot_id, confirmed_leader_id, confirmed_support_id
//    b. Send 3 confirmation emails via Resend
//    c. Return { confirmed: true, slot }
// 6. Else return { confirmed: false }
```

### Quorum Check (`lib/quorum.ts`)
```typescript
export async function checkQuorum(meetingId: string) {
  // Fetch all slots for meeting ordered by starts_at asc
  // For each slot:
  //   fetch responses joined with team_members
  //   check roles array includes 'leader' AND 'support'
  //   if yes: return { slot, leaderId, supportId }
  // Return null if no qualifying slot
}
```

---

## Email Templates

### Team Notification
```
Subject: New meeting request from {participantName}
To: {teamMemberEmail}

{participantName} has requested a meeting.
Topic: {topic}

Proposed times:
{slot list — formatted date + time range}

Select your availability:
{votingLink}
```

### Participant Confirmation
```
Subject: Your meeting is confirmed — {formattedDate}
To: {participantEmail}

Your meeting has been confirmed.
Date & Time: {formattedDateTime}
You will meet with: {leaderName} and {supportName}
```

### Team Confirmation
```
Subject: Meeting confirmed with {participantName} — {formattedDate}
To: {leaderEmail} and {supportEmail}

Participant: {participantName} ({participantEmail})
Topic: {topic}
Date & Time: {formattedDateTime}
```

---

## Voting Link Format
```
{NEXT_PUBLIC_APP_URL}/team/meetings/{meetingId}?member={teamMemberId}
```
