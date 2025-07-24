-- Create orders table to track payment information
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  amount INTEGER NOT NULL,             -- Amount charged (in cents)
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending',       -- e.g., 'pending', 'paid', 'failed'
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  service_details JSONB,               -- Store cleaning service details
  square_footage INTEGER,
  cleaning_type TEXT,
  frequency TEXT,
  add_ons TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row-Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies for orders
CREATE POLICY "select_own_orders" ON public.orders
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "insert_order" ON public.orders
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "update_order" ON public.orders
  FOR UPDATE
  USING (true);