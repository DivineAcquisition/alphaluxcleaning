-- AlphaLux Cleaning — per-customer promo lock + percentage support
-- ---------------------------------------------------------------
-- Goals:
--   1. Enforce "one redemption per customer" for codes flagged
--      `once_per_customer`. Previously, the promo_redemptions table
--      only had a UNIQUE(code, booking_id) constraint, which allowed
--      the same customer (different booking) or even the same email
--      (different customer row) to redeem twice.
--   2. Add support for percentage-style discounts (50% off) alongside
--      the existing flat "amount_cents" model. Legacy codes keep
--      working (type='FIXED').
--   3. Stamp every redemption with a normalized email so we catch
--      guests who didn't log in but booked under the same address.
--   4. Seed the active ALC2026 = 50% new-customer code with
--      once_per_customer = TRUE.

-- --- 1. Extend promo_codes ----------------------------------------------
ALTER TABLE public.promo_codes
  DROP CONSTRAINT IF EXISTS promo_codes_type_check;

ALTER TABLE public.promo_codes
  ADD CONSTRAINT promo_codes_type_check
  CHECK (type IN ('FIXED', 'PERCENT'));

ALTER TABLE public.promo_codes
  ADD COLUMN IF NOT EXISTS percent_off INTEGER
    CHECK (percent_off IS NULL OR (percent_off > 0 AND percent_off <= 100));

ALTER TABLE public.promo_codes
  ADD COLUMN IF NOT EXISTS once_per_customer BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.promo_codes
  ADD COLUMN IF NOT EXISTS new_customers_only BOOLEAN NOT NULL DEFAULT FALSE;

-- Allow amount_cents to be 0 when the discount is expressed as a percentage
ALTER TABLE public.promo_codes
  DROP CONSTRAINT IF EXISTS promo_codes_amount_cents_check;

ALTER TABLE public.promo_codes
  ADD CONSTRAINT promo_codes_amount_cents_check
  CHECK (amount_cents >= 0);

-- --- 2. Extend promo_redemptions ---------------------------------------
ALTER TABLE public.promo_redemptions
  ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- Backfill email from customers table for existing rows
UPDATE public.promo_redemptions r
SET customer_email = LOWER(TRIM(c.email))
FROM public.customers c
WHERE r.customer_email IS NULL
  AND r.customer_id = c.id
  AND c.email IS NOT NULL;

-- Partial unique index: enforces one-redemption-per-customer for codes
-- that have once_per_customer = TRUE. We index both customer_id and
-- (lower(email)) so guests who rebook under a fresh customer record with
-- the same email still get blocked.
CREATE UNIQUE INDEX IF NOT EXISTS
  uniq_promo_redemptions_code_customer
  ON public.promo_redemptions (code, customer_id)
  WHERE customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS
  uniq_promo_redemptions_code_email
  ON public.promo_redemptions (code, LOWER(customer_email))
  WHERE customer_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS
  idx_promo_redemptions_code_lc_email
  ON public.promo_redemptions (code, LOWER(customer_email));

-- --- 3. Server-side guard: block redemption when once_per_customer --
-- Even if a caller bypasses the edge function and writes directly, the
-- database refuses to record a second redemption of a once_per_customer
-- code for the same (customer_id OR normalized email).
CREATE OR REPLACE FUNCTION public.enforce_promo_once_per_customer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_once_per_customer BOOLEAN;
  v_new_customers_only BOOLEAN;
  v_email TEXT;
  v_existing_count INTEGER;
BEGIN
  SELECT once_per_customer, new_customers_only
    INTO v_once_per_customer, v_new_customers_only
  FROM public.promo_codes
  WHERE code = NEW.code;

  -- Always normalize and stash email so future lookups are stable
  IF NEW.customer_email IS NULL AND NEW.customer_id IS NOT NULL THEN
    SELECT LOWER(TRIM(email)) INTO v_email
    FROM public.customers
    WHERE id = NEW.customer_id
    LIMIT 1;

    NEW.customer_email := v_email;
  ELSIF NEW.customer_email IS NOT NULL THEN
    NEW.customer_email := LOWER(TRIM(NEW.customer_email));
  END IF;

  IF COALESCE(v_once_per_customer, FALSE) = FALSE THEN
    RETURN NEW;
  END IF;

  -- Check prior redemptions for this customer / email
  SELECT COUNT(*) INTO v_existing_count
  FROM public.promo_redemptions
  WHERE code = NEW.code
    AND (
      (NEW.customer_id IS NOT NULL AND customer_id = NEW.customer_id)
      OR (NEW.customer_email IS NOT NULL
          AND LOWER(customer_email) = NEW.customer_email)
    );

  IF v_existing_count > 0 THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = format(
        'Promo code %s has already been used by this customer',
        NEW.code
      ),
      HINT = 'promo_once_per_customer_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_promo_once_per_customer
  ON public.promo_redemptions;

CREATE TRIGGER trg_promo_once_per_customer
  BEFORE INSERT ON public.promo_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_promo_once_per_customer();

-- --- 4. Seed ALC2026 (50% off, one per customer) -----------------------
INSERT INTO public.promo_codes (
  code,
  type,
  amount_cents,
  percent_off,
  max_redemptions,
  applies_to,
  active,
  once_per_customer,
  new_customers_only,
  metadata
)
VALUES (
  'ALC2026',
  'PERCENT',
  0,
  50,
  1000000,
  'ANY',
  TRUE,
  TRUE,
  TRUE,
  jsonb_build_object(
    'label', '50% OFF your first AlphaLux Cleaning',
    'audience', 'new_customer'
  )
)
ON CONFLICT (code) DO UPDATE
SET type = EXCLUDED.type,
    percent_off = EXCLUDED.percent_off,
    once_per_customer = EXCLUDED.once_per_customer,
    new_customers_only = EXCLUDED.new_customers_only,
    applies_to = EXCLUDED.applies_to,
    active = TRUE,
    metadata = promo_codes.metadata || EXCLUDED.metadata,
    updated_at = now();

-- --- 5. Helpful view for admins ---------------------------------------
CREATE OR REPLACE VIEW public.promo_redemptions_by_customer AS
SELECT
  r.code,
  r.customer_id,
  r.customer_email,
  COUNT(*) AS redemption_count,
  MIN(r.created_at) AS first_redeemed_at,
  MAX(r.created_at) AS last_redeemed_at,
  SUM(r.discount_cents) AS total_discount_cents
FROM public.promo_redemptions r
GROUP BY r.code, r.customer_id, r.customer_email;

COMMENT ON VIEW public.promo_redemptions_by_customer IS
  'AlphaLux promo redemption ledger per customer. Used by admin tools to
   audit who has redeemed one-per-customer codes (e.g. ALC2026).';
