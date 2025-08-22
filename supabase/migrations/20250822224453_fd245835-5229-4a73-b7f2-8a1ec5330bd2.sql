
-- 1) Ensure orders has the fields the edge function writes
-- Some of these columns may already exist; IF NOT EXISTS keeps this safe to run repeatedly.

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS stripe_setup_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- 2) Add helpful indexes to speed up lookups by Stripe intent ids
CREATE INDEX IF NOT EXISTS orders_stripe_setup_intent_id_idx ON public.orders (stripe_setup_intent_id);
CREATE INDEX IF NOT EXISTS orders_stripe_payment_intent_id_idx ON public.orders (stripe_payment_intent_id);

-- Note:
-- - amount is already INTEGER NOT NULL which works for both immediate payment (cents) and authorization (0).
-- - service_details JSONB already exists in your schema; no change needed.
-- - Existing RLS policies allow inserts/updates (trusted code), which is fine for the edge function use case.
