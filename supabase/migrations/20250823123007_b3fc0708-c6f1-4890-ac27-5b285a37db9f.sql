
-- 1) Ensure required columns exist on orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_setup_intent_id TEXT;

-- 2) Helpful indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent
  ON public.orders (stripe_payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_orders_setup_intent
  ON public.orders (stripe_setup_intent_id);

CREATE INDEX IF NOT EXISTS idx_orders_customer_email
  ON public.orders (customer_email);

-- Note: We are not adding UNIQUE constraints here to avoid conflicts with any existing data.
-- If you want strict uniqueness on intent IDs later, we can add them after confirming data shape.
