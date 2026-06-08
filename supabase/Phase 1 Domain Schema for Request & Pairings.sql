-- ============================================================
-- Sprint 004a Migration
-- Group Meet — Phase 1 Schema Update
-- Run in Supabase SQL Editor
-- Date: [INSERT DATE]
-- ============================================================
-- This migration is ADDITIVE ONLY.
-- Old columns are preserved so existing pages continue to work.
-- They will be removed in a future cleanup migration once all
-- legacy code has been replaced.
-- ============================================================


-- ------------------------------------------------------------
-- 1. meetings table — add new domain columns
-- ------------------------------------------------------------

ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS client_name      text,
  ADD COLUMN IF NOT EXISTS client_email     text,
  ADD COLUMN IF NOT EXISTS meeting_type     text CHECK (meeting_type IN ('in_depth', 'short_form'));

-- Note: participant_name, participant_email, topic are intentionally preserved.
-- Note: confirmed_leader_id, confirmed_support_id, confirmed_slot_id preserved for legacy pages.


-- ------------------------------------------------------------
-- 2. time_slots table — no changes needed yet
-- starts_at and ends_at are already correct column names.
-- ------------------------------------------------------------


-- ------------------------------------------------------------
-- 3. Create requests table (future domain successor to meetings)
-- Not yet wired to the app — created now so the schema is
-- tracked and ready for the full migration sprint.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS requests (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name               text NOT NULL,
  client_email              text NOT NULL,
  meeting_type              text NOT NULL CHECK (meeting_type IN ('in_depth', 'short_form')),
  status                    text NOT NULL DEFAULT 'pending'
                              CHECK (status IN (
                                'pending',
                                'flagged',
                                'ready_for_pairing',
                                'paired',
                                'awaiting_confirmation',
                                'confirmed',
                                'completed',
                                'cancelled'
                              )),
  business_timezone         text NOT NULL DEFAULT 'US/Eastern',
  client_magic_link_sent_at timestamptz,
  confirmed_slot_id         uuid,
  confirmed_at              timestamptz,
  cancelled_at              timestamptz,
  completed_at              timestamptz,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);


-- ------------------------------------------------------------
-- 4. Create slots table (future domain successor to time_slots)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS slots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  starts_at   timestamptz NOT NULL,
  is_active   boolean NOT NULL DEFAULT true,
  pruned_at   timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);


-- ------------------------------------------------------------
-- 5. Create professionals table
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS professionals (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  email      text NOT NULL UNIQUE,
  tier       text NOT NULL DEFAULT 'general'
               CHECK (tier IN ('in_depth', 'general')),
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);


-- ------------------------------------------------------------
-- 6. Create professional_responses table
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS professional_responses (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id       uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  professional_id  uuid NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  role_preference  text NOT NULL CHECK (role_preference IN ('lead', 'support', 'either')),
  submitted_at     timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, professional_id)
);


-- ------------------------------------------------------------
-- 7. Create professional_response_slots join table
-- (normalized per Decision 030 — no array fields)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS professional_response_slots (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id  uuid NOT NULL REFERENCES professional_responses(id) ON DELETE CASCADE,
  slot_id      uuid NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
  UNIQUE (response_id, slot_id)
);


-- ------------------------------------------------------------
-- 8. Create pairings table
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pairings (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id              uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  lead_professional_id    uuid NOT NULL REFERENCES professionals(id),
  support_professional_id uuid NOT NULL REFERENCES professionals(id),
  location                text NOT NULL,
  is_locked               boolean NOT NULL DEFAULT false,
  locked_at               timestamptz,
  approved_by_admin_id    uuid,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  CHECK (lead_professional_id != support_professional_id)
);


-- ------------------------------------------------------------
-- 9. Create pairing_slots join table
-- (normalized per Decision 030 — no array fields)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pairing_slots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pairing_id  uuid NOT NULL REFERENCES pairings(id) ON DELETE CASCADE,
  slot_id     uuid NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
  UNIQUE (pairing_id, slot_id)
);


-- ------------------------------------------------------------
-- 10. Create admins table
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS admins (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email               text NOT NULL UNIQUE,
  name                text,
  role                text NOT NULL DEFAULT 'admin'
                        CHECK (role IN ('admin', 'super_admin')),
  invited_by_admin_id uuid REFERENCES admins(id),
  invited_at          timestamptz,
  accepted_at         timestamptz,
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Back-fill approved_by_admin_id foreign key now that admins exists
ALTER TABLE pairings
  ADD CONSTRAINT pairings_approved_by_admin_id_fkey
  FOREIGN KEY (approved_by_admin_id) REFERENCES admins(id);


-- ------------------------------------------------------------
-- 11. Create magic_links table
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS magic_links (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash       text NOT NULL UNIQUE,
  entity_type      text NOT NULL CHECK (entity_type IN ('client', 'professional')),
  request_id       uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  professional_id  uuid REFERENCES professionals(id),
  purpose          text NOT NULL CHECK (purpose IN (
                     'professional_response',
                     'client_confirmation',
                     'client_edit_request'
                   )),
  expires_at       timestamptz,
  last_used_at     timestamptz,
  revoked_at       timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);


-- ------------------------------------------------------------
-- 12. Create email_templates table
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS email_templates (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key          text NOT NULL UNIQUE,
  recipient_type        text NOT NULL CHECK (recipient_type IN ('client', 'professional', 'admin')),
  subject               text NOT NULL,
  body                  text NOT NULL,
  is_active             boolean NOT NULL DEFAULT true,
  updated_by_admin_id   uuid REFERENCES admins(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);


-- ------------------------------------------------------------
-- 13. Create platform_settings table
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS platform_settings (
  key                   text PRIMARY KEY,
  value                 text NOT NULL,
  description           text,
  updated_by_admin_id   uuid REFERENCES admins(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Seed default business timezone
INSERT INTO platform_settings (key, value, description)
VALUES ('business_timezone', 'US/Eastern', 'Platform-wide timezone used for all slot storage and display.')
ON CONFLICT (key) DO NOTHING;


-- ------------------------------------------------------------
-- 14. Indexes
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_slots_request_id         ON slots(request_id);
CREATE INDEX IF NOT EXISTS idx_slots_starts_at           ON slots(starts_at);
CREATE INDEX IF NOT EXISTS idx_prof_responses_request    ON professional_responses(request_id);
CREATE INDEX IF NOT EXISTS idx_prof_responses_prof       ON professional_responses(professional_id);
CREATE INDEX IF NOT EXISTS idx_magic_links_token_hash    ON magic_links(token_hash);
CREATE INDEX IF NOT EXISTS idx_magic_links_request_id    ON magic_links(request_id);
CREATE INDEX IF NOT EXISTS idx_pairings_request_id       ON pairings(request_id);
CREATE INDEX IF NOT EXISTS idx_professionals_email       ON professionals(email);
CREATE INDEX IF NOT EXISTS idx_professionals_tier        ON professionals(tier);


-- ============================================================
-- Migration complete.
-- Next step: run Sprint 004b to build the public request form.
-- Legacy tables (meetings, time_slots, team_members, responses)
-- are untouched and will be cleaned up in a future migration.
-- ============================================================