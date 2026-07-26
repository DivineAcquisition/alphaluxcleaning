-- ============================================================================
-- Lead intro notifications — speed-to-lead SMS + internal alert
--
-- The moment a visitor submits their name/email/phone at the top of the
-- booking funnel (/book/zip), we:
--   * text them an intro from the OpenPhone number that matches their
--     state (NJ / TX / CA / NY — resolved from state, else ZIP), and
--   * email the internal ops mailbox so a human can follow up fast.
--
-- This table is the idempotency ledger for that fan-out. One row per
-- lead (keyed on normalized email); the sender claims the SMS slot
-- atomically before dispatch, exactly like bookings.confirmation_sms_sent_at,
-- so a double-submitted form or a retried webhook can never double-text
-- a lead. A failed send releases the claim so a later attempt can retry.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lead_intro_notifications (
  email text PRIMARY KEY,               -- normalized (trimmed, lowercased)
  phone_digits text,                    -- 10-digit US core, for opt-out matching
  first_name text,
  last_name text,
  zip_code text,
  state_code text,                      -- resolved market: NJ | TX | CA | NY
  from_number text,                     -- OpenPhone number the intro was sent from
  intro_sms_sent_at timestamptz,        -- claimed atomically before sending
  intro_sms_status text,                -- sent | failed | skipped_opted_out | skipped_no_phone
  intro_sms_error text,
  internal_email_sent_at timestamptz,
  -- Set when this lead later shows up as a real booking, so ops can see
  -- speed-to-lead → conversion without joining through partial_bookings.
  converted_booking_id uuid,
  converted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_intro_notifications_created_idx
  ON public.lead_intro_notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS lead_intro_notifications_phone_idx
  ON public.lead_intro_notifications (phone_digits);
CREATE INDEX IF NOT EXISTS lead_intro_notifications_state_idx
  ON public.lead_intro_notifications (state_code);

COMMENT ON TABLE public.lead_intro_notifications IS
  'Idempotency ledger + audit trail for the speed-to-lead intro SMS and internal ops alert fired at booking-funnel lead capture.';

-- Attribute a lead to the booking they eventually made.
--
-- `bookings` has no email column — the address of record lives on the
-- linked customer row — so we resolve it through customer_id.
CREATE OR REPLACE FUNCTION public.tg_lead_intro_mark_converted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  IF NEW.customer_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT lower(trim(c.email)) INTO v_email
  FROM public.customers c
  WHERE c.id = NEW.customer_id;

  IF v_email IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.lead_intro_notifications
  SET converted_booking_id = NEW.id,
      converted_at = now(),
      updated_at = now()
  WHERE email = v_email
    AND converted_booking_id IS NULL;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_lead_intro_conversion ON public.bookings;
CREATE TRIGGER bookings_lead_intro_conversion
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_lead_intro_mark_converted();

-- RLS: edge functions (service role) write; admins read in the workspace.
ALTER TABLE public.lead_intro_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lead_intro_notifications_service_role_all
  ON public.lead_intro_notifications;
CREATE POLICY lead_intro_notifications_service_role_all
  ON public.lead_intro_notifications
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS lead_intro_notifications_admin_read
  ON public.lead_intro_notifications;
CREATE POLICY lead_intro_notifications_admin_read
  ON public.lead_intro_notifications
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );
