-- Create referral system tables (fixed)

-- Add referral columns to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS referral_code text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS referral_link text;

-- Add referral columns to bookings table  
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS referrer_code text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS referrer_customer_id uuid;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS attribution_method text;

-- Add constraints after columns exist
ALTER TABLE customers ADD CONSTRAINT customers_referral_code_unique UNIQUE (referral_code);
ALTER TABLE bookings ADD CONSTRAINT bookings_referrer_customer_fk FOREIGN KEY (referrer_customer_id) REFERENCES customers(id);
ALTER TABLE bookings ADD CONSTRAINT bookings_attribution_method_check CHECK (attribution_method IN ('COOKIE', 'LAST_CLICK', 'MANUAL'));

-- Create referrals tracking table
CREATE TABLE IF NOT EXISTS referrals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    referred_customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
    referred_email text NOT NULL,
    status text NOT NULL CHECK (status IN ('PENDING', 'BOOKED', 'REWARDED', 'REJECTED')) DEFAULT 'PENDING',
    source text,
    utms jsonb DEFAULT '{}',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    attributed_at timestamp with time zone,
    UNIQUE(referrer_customer_id, referred_email)
);

-- Create referral rewards table
CREATE TABLE IF NOT EXISTS referral_rewards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('CREDIT_REFERRER', 'CREDIT_REFERRED')),
    amount_cents integer NOT NULL,
    status text NOT NULL CHECK (status IN ('EARNED', 'APPLIED', 'CANCELLED')) DEFAULT 'EARNED',
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    redeemed_at timestamp with time zone
);

-- Create attribution events table for audit trail
CREATE TABLE IF NOT EXISTS attribution_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event text NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}',
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribution_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals
CREATE POLICY "Users can view their referrals" ON referrals
    FOR SELECT USING (
        referrer_customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()) OR
        referred_customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    );

CREATE POLICY "Service role can manage referrals" ON referrals
    FOR ALL USING (true);

-- RLS policies for referral_rewards
CREATE POLICY "Users can view their rewards" ON referral_rewards
    FOR SELECT USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));

CREATE POLICY "Service role can manage rewards" ON referral_rewards
    FOR ALL USING (true);

-- RLS policies for attribution_events
CREATE POLICY "Service role can manage attribution events" ON attribution_events
    FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_customer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_customer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_email ON referrals(referred_email);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_customer ON referral_rewards(customer_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON referral_rewards(status);
CREATE INDEX IF NOT EXISTS idx_customers_referral_code ON customers(referral_code);
CREATE INDEX IF NOT EXISTS idx_bookings_referrer ON bookings(referrer_customer_id);