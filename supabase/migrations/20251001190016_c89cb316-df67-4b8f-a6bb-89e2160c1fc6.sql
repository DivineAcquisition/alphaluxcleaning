-- ============================================
-- AlphaLuxClean Referral System Database Schema (Fixed)
-- ============================================

-- Step 1: Drop old referrals table if it exists (has different structure)
DROP TABLE IF EXISTS public.referrals CASCADE;

-- Step 2: Update customers table for referral codes
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS referral_code TEXT,
ADD COLUMN IF NOT EXISTS referral_link TEXT;

-- Add unique constraint if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'customers_referral_code_key'
  ) THEN
    ALTER TABLE public.customers ADD CONSTRAINT customers_referral_code_key UNIQUE (referral_code);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_customers_referral_code ON public.customers(referral_code);

-- Step 3: Update bookings table for referral attribution
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS first_booking BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS referrer_customer_id UUID,
ADD COLUMN IF NOT EXISTS referrer_code TEXT,
ADD COLUMN IF NOT EXISTS attribution_method TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Add foreign key constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bookings_referrer_customer_id_fkey'
  ) THEN
    ALTER TABLE public.bookings 
    ADD CONSTRAINT bookings_referrer_customer_id_fkey 
    FOREIGN KEY (referrer_customer_id) REFERENCES public.customers(id);
  END IF;
END $$;

-- Add check constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bookings_attribution_method_check'
  ) THEN
    ALTER TABLE public.bookings 
    ADD CONSTRAINT bookings_attribution_method_check 
    CHECK (attribution_method IN ('COOKIE', 'LAST_CLICK', 'MANUAL'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bookings_referrer ON public.bookings(referrer_customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_paid_at ON public.bookings(paid_at);

-- Step 4: Create new referrals table with correct structure
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_customer_id UUID NOT NULL REFERENCES public.customers(id),
  referred_customer_id UUID REFERENCES public.customers(id),
  referred_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','BOOKED','REWARDED','REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attributed_at TIMESTAMPTZ,
  utms JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_customer_id);
CREATE INDEX idx_referrals_referred ON public.referrals(referred_customer_id);
CREATE INDEX idx_referrals_status ON public.referrals(status);

-- Step 5: Create referral_rewards table
CREATE TABLE public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  type TEXT NOT NULL CHECK(type IN ('CREDIT_REFERRER','CREDIT_REFERRED')),
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'EARNED' CHECK(status IN ('EARNED','APPLIED','CANCELLED')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  redeemed_at TIMESTAMPTZ,
  booking_id UUID REFERENCES public.bookings(id)
);

CREATE INDEX idx_referral_rewards_customer ON public.referral_rewards(customer_id);
CREATE INDEX idx_referral_rewards_status ON public.referral_rewards(status);

-- Step 6: Create attribution_events table
CREATE TABLE public.attribution_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attribution_events_event ON public.attribution_events(event);
CREATE INDEX idx_attribution_events_created_at ON public.attribution_events(created_at);

-- Step 7: Update referral_config table (keep existing config)
ALTER TABLE public.referral_config
ADD COLUMN IF NOT EXISTS give_amount INTEGER DEFAULT 5000,
ADD COLUMN IF NOT EXISTS get_amount INTEGER DEFAULT 5000,
ADD COLUMN IF NOT EXISTS cookie_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS last_click_days INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS referral_seed TEXT DEFAULT '971347';

-- Update existing config record if exists
UPDATE public.referral_config 
SET 
  give_amount = COALESCE(give_amount, 5000),
  get_amount = COALESCE(get_amount, 5000),
  cookie_days = COALESCE(cookie_days, 30),
  last_click_days = COALESCE(last_click_days, 7),
  referral_seed = COALESCE(referral_seed, '971347')
WHERE active = true;

-- Step 8: Enable RLS on new tables
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribution_events ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS Policies
CREATE POLICY "Users can view their own referrals" ON public.referrals
  FOR SELECT USING (
    referrer_customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
    OR referred_customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all referrals" ON public.referrals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can view their own rewards" ON public.referral_rewards
  FOR SELECT USING (
    customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all rewards" ON public.referral_rewards
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can view attribution events" ON public.attribution_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );