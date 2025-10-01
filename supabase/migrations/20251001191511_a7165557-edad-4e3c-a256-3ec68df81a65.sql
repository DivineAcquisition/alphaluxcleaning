-- Create promo_codes table
CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('FIXED')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  max_redemptions INTEGER NOT NULL DEFAULT 1 CHECK (max_redemptions > 0),
  redemptions INTEGER NOT NULL DEFAULT 0 CHECK (redemptions >= 0),
  applies_to TEXT NOT NULL DEFAULT 'ONE_TIME' CHECK (applies_to IN ('ONE_TIME', 'RECUR_FIRST', 'ANY')),
  min_subtotal_cents INTEGER NOT NULL DEFAULT 0 CHECK (min_subtotal_cents >= 0),
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create promo_redemptions table
CREATE TABLE public.promo_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  discount_cents INTEGER NOT NULL CHECK (discount_cents > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(code, booking_id)
);

-- Create indexes
CREATE INDEX idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX idx_promo_codes_active ON public.promo_codes(active, expires_at);
CREATE INDEX idx_promo_redemptions_code ON public.promo_redemptions(code, created_at);
CREATE INDEX idx_promo_redemptions_customer ON public.promo_redemptions(customer_id);
CREATE INDEX idx_promo_redemptions_booking ON public.promo_redemptions(booking_id);

-- Trigger for updated_at
CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promo_codes
CREATE POLICY "Admins can manage all promo codes"
  ON public.promo_codes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Public can view active promo codes"
  ON public.promo_codes
  FOR SELECT
  USING (active = true);

-- RLS Policies for promo_redemptions
CREATE POLICY "Admins can view all redemptions"
  ON public.promo_redemptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role can manage redemptions"
  ON public.promo_redemptions
  FOR ALL
  USING (true);

-- Add promo code fields to bookings table
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS promo_code TEXT,
  ADD COLUMN IF NOT EXISTS promo_discount_cents INTEGER DEFAULT 0;

-- Seed the launch codes
INSERT INTO public.promo_codes (code, type, amount_cents, max_redemptions, applies_to, expires_at, metadata)
VALUES 
  ('ALC-30-1X-7GQ3', 'FIXED', 3000, 1, 'ONE_TIME', NOW() + INTERVAL '30 days', '{"campaign": "LAUNCH30", "notes": "$30 off one-time clean"}'::jsonb),
  ('ALC-30-1X-9MZ8', 'FIXED', 3000, 1, 'ONE_TIME', NOW() + INTERVAL '30 days', '{"campaign": "LAUNCH30", "notes": "$30 off one-time clean"}'::jsonb),
  ('ALC-30-1X-T4KF', 'FIXED', 3000, 1, 'ONE_TIME', NOW() + INTERVAL '30 days', '{"campaign": "LAUNCH30", "notes": "$30 off one-time clean (backup)"}'::jsonb),
  ('ALC-30-1X-P2HV', 'FIXED', 3000, 1, 'ONE_TIME', NOW() + INTERVAL '30 days', '{"campaign": "LAUNCH30", "notes": "$30 off one-time clean (backup)"}'::jsonb);