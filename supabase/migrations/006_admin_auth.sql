-- Migration 006: Admin Authentication
-- Adds auth_user_id to the admins table to link admin records to Supabase Auth users.
-- Safe to re-run: uses IF NOT EXISTS / IF EXISTS guards throughout.

-- 1. Add auth_user_id column to admins table
ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Create a unique index so each Supabase Auth user maps to at most one admin record
CREATE UNIQUE INDEX IF NOT EXISTS admins_auth_user_id_idx
  ON admins (auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- 3. Ensure the admin_role enum exists (it may already exist from a prior migration or manual setup)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_role') THEN
    CREATE TYPE admin_role AS ENUM ('admin', 'super_admin');
  END IF;
END
$$;

-- 4. Ensure the admins table exists with the full schema
-- This is a no-op if the table already exists (created manually or by an earlier migration).
CREATE TABLE IF NOT EXISTS admins (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email           text NOT NULL UNIQUE,
  name            text,
  role            admin_role NOT NULL DEFAULT 'admin',
  invited_by_admin_id uuid REFERENCES admins(id) ON DELETE SET NULL,
  invited_at      timestamptz,
  accepted_at     timestamptz,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- 5. RLS: enable row-level security on admins (safe to run even if already enabled)
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 6. RLS policy: service role can read/write admins freely (used by API routes)
-- Drop and recreate to keep idempotent.
DROP POLICY IF EXISTS admins_service_role_all ON admins;
CREATE POLICY admins_service_role_all ON admins
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 7. RLS policy: authenticated users can read their own admin row (used by SSR auth helpers)
DROP POLICY IF EXISTS admins_self_read ON admins;
CREATE POLICY admins_self_read ON admins
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- 8. Block all other access by default (anon role has no policies → no access)
