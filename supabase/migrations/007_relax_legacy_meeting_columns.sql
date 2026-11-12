-- Sprint 006 follow-up: relax legacy NOT NULL constraints on meetings
--
-- The public request form (Sprint 004) writes client_name, client_email and
-- meeting_type. It no longer writes participant_name, participant_email or
-- topic, but those legacy columns are still NOT NULL in the live database,
-- so POST /api/meetings fails with Postgres error 23502.
--
-- Dropping NOT NULL is non-destructive: existing rows and data are untouched,
-- and the statements are safe to run more than once.
-- Run in the Supabase SQL Editor.

alter table meetings alter column participant_name drop not null;
alter table meetings alter column participant_email drop not null;
alter table meetings alter column topic drop not null;
