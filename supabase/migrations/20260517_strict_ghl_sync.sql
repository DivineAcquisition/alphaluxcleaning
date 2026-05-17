-- ─── Stricter GHL ↔ bookings sync ──────────────────────────────────────────
-- Adds per-booking sync stamps so the new reconcile-ghl cron can detect
-- never-synced / stale / failed rows and replay them through
-- ghl-sync-booking. Mirrors the pattern used in the novaracleaning project
-- (see /workspace docs) but uses the AlphaLuxClean GHL PIT + location, not
-- the Novara location.
--
-- Columns added to public.bookings:
--   ghl_synced_at         — set to now() by ghl-sync-booking on success
--   ghl_sync_attempts     — incremented on every sync attempt (success or fail)
--   ghl_sync_error        — last error message (NULL on success)
--   ghl_opportunity_id    — most-recently-touched opportunity id in GHL
--   ghl_appointment_id    — most-recently-touched appointment id in GHL
--
-- A small index on `ghl_synced_at` keeps the reconcile cron O(log n) on the
-- "never synced" bucket. We also widen ghl_sync_log to track booking
-- mutation context (trigger_op / source) so the same table can hold both
-- the original stage='booking' / stage='lead' rows AND the reconcile rows.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS ghl_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ghl_sync_attempts INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS ghl_sync_error TEXT,
  ADD COLUMN IF NOT EXISTS ghl_opportunity_id TEXT,
  ADD COLUMN IF NOT EXISTS ghl_appointment_id TEXT;

CREATE INDEX IF NOT EXISTS bookings_ghl_synced_at_idx
  ON public.bookings (ghl_synced_at NULLS FIRST);

CREATE INDEX IF NOT EXISTS bookings_ghl_sync_error_idx
  ON public.bookings (ghl_sync_error)
  WHERE ghl_sync_error IS NOT NULL;

-- ghl_sync_log: keep the original columns AND surface a couple of new
-- ones that reconcile-ghl writes (source / trigger_op / http_status /
-- succeeded). These piggyback on the existing log table so a single
-- audit query covers every sync source.
ALTER TABLE public.ghl_sync_log
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS trigger_op TEXT,
  ADD COLUMN IF NOT EXISTS succeeded BOOLEAN,
  ADD COLUMN IF NOT EXISTS http_status INTEGER,
  ADD COLUMN IF NOT EXISTS error_message TEXT;

CREATE INDEX IF NOT EXISTS ghl_sync_log_booking_id_idx
  ON public.ghl_sync_log (booking_id, created_at DESC);
