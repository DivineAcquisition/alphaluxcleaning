-- Create referral system tables

-- Add referral columns to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS referral_link text;

-- Add referral columns to bookings table  
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS referrer_code text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS referrer_customer_id uuid REFERENCES customers(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS attribution_method text CHECK (attribution_method IN ('COOKIE', 'LAST_CLICK', 'MANUAL'));

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

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code(customer_email text, customer_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    referral_seed constant text := '971347';
    base_hash text;
    code_candidate text;
    collision_count int := 0;
BEGIN
    -- Create hash from email + seed + customer_id
    base_hash := encode(
        digest(customer_email || referral_seed || customer_id::text, 'sha256'), 
        'hex'
    );
    
    -- Convert first 8 characters to base36 and uppercase
    code_candidate := upper(substring(base_hash, 1, 8));
    
    -- Check for collisions and append checksum if needed
    WHILE EXISTS (SELECT 1 FROM customers WHERE referral_code = code_candidate) LOOP
        collision_count := collision_count + 1;
        code_candidate := upper(substring(base_hash, 1, 7)) || collision_count::text;
    END LOOP;
    
    RETURN code_candidate;
END;
$$;

-- Function to issue referral code to customer
CREATE OR REPLACE FUNCTION issue_referral_code(input_customer_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    customer_record customers%ROWTYPE;
    new_code text;
    app_url constant text := 'https://app.alphaluxclean.com';
BEGIN
    -- Get customer details
    SELECT * INTO customer_record FROM customers WHERE id = input_customer_id;
    
    IF customer_record.id IS NULL THEN
        RAISE EXCEPTION 'Customer not found';
    END IF;
    
    -- Return existing code if already exists
    IF customer_record.referral_code IS NOT NULL THEN
        RETURN customer_record.referral_code;
    END IF;
    
    -- Generate new code
    new_code := generate_referral_code(customer_record.email, customer_record.id);
    
    -- Update customer with code and link
    UPDATE customers 
    SET 
        referral_code = new_code,
        referral_link = app_url || '/ref/' || new_code
    WHERE id = input_customer_id;
    
    RETURN new_code;
END;
$$;

-- Function to attribute referral
CREATE OR REPLACE FUNCTION attribute_referral(
    input_booking_id uuid,
    input_ref_code text,
    input_utms jsonb DEFAULT '{}',
    input_attribution_method text DEFAULT 'COOKIE'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    booking_record bookings%ROWTYPE;
    referrer_customer customers%ROWTYPE;
    referral_id uuid;
BEGIN
    -- Get booking details
    SELECT * INTO booking_record FROM bookings WHERE id = input_booking_id;
    
    IF booking_record.id IS NULL THEN
        RAISE EXCEPTION 'Booking not found';
    END IF;
    
    -- Find referrer by code
    SELECT c.* INTO referrer_customer 
    FROM customers c 
    WHERE c.referral_code = input_ref_code;
    
    IF referrer_customer.id IS NULL THEN
        RAISE EXCEPTION 'Invalid referral code';
    END IF;
    
    -- Prevent self-referrals
    IF referrer_customer.id = booking_record.customer_id THEN
        RAISE EXCEPTION 'Self-referrals not allowed';
    END IF;
    
    -- Update booking with referral info
    UPDATE bookings 
    SET 
        referrer_code = input_ref_code,
        referrer_customer_id = referrer_customer.id,
        attribution_method = input_attribution_method
    WHERE id = input_booking_id;
    
    -- Create or update referral record
    INSERT INTO referrals (
        referrer_customer_id,
        referred_customer_id,
        referred_email,
        status,
        source,
        utms,
        attributed_at
    ) VALUES (
        referrer_customer.id,
        booking_record.customer_id,
        (SELECT email FROM customers WHERE id = booking_record.customer_id),
        'PENDING',
        'BOOKING',
        input_utms,
        now()
    )
    ON CONFLICT (referrer_customer_id, referred_email) 
    DO UPDATE SET
        referred_customer_id = booking_record.customer_id,
        status = 'PENDING',
        attributed_at = now(),
        utms = input_utms
    RETURNING id INTO referral_id;
    
    -- Log attribution event
    INSERT INTO attribution_events (event, payload) VALUES (
        'REFERRAL_ATTRIBUTED',
        jsonb_build_object(
            'booking_id', input_booking_id,
            'referrer_customer_id', referrer_customer.id,
            'referred_customer_id', booking_record.customer_id,
            'referral_code', input_ref_code,
            'attribution_method', input_attribution_method
        )
    );
    
    RETURN referral_id;
END;
$$;

-- Function to issue referral rewards
CREATE OR REPLACE FUNCTION issue_referral_rewards(input_booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    booking_record bookings%ROWTYPE;
    referral_record referrals%ROWTYPE;
    referrer_amount_cents constant int := 2500; -- $25.00
    referred_amount_cents constant int := 2500; -- $25.00
BEGIN
    -- Get booking details
    SELECT * INTO booking_record FROM bookings WHERE id = input_booking_id;
    
    IF booking_record.id IS NULL THEN
        RAISE EXCEPTION 'Booking not found';
    END IF;
    
    -- Skip if no referral attribution
    IF booking_record.referrer_customer_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Get referral record
    SELECT * INTO referral_record 
    FROM referrals 
    WHERE referrer_customer_id = booking_record.referrer_customer_id 
    AND referred_customer_id = booking_record.customer_id;
    
    IF referral_record.id IS NULL THEN
        RAISE EXCEPTION 'Referral record not found';
    END IF;
    
    -- Update referral status to BOOKED
    UPDATE referrals 
    SET status = 'BOOKED' 
    WHERE id = referral_record.id;
    
    -- Issue reward to referrer
    INSERT INTO referral_rewards (customer_id, type, amount_cents, notes) VALUES (
        booking_record.referrer_customer_id,
        'CREDIT_REFERRER',
        referrer_amount_cents,
        'Referral reward for booking #' || input_booking_id
    );
    
    -- Issue reward to referred customer
    INSERT INTO referral_rewards (customer_id, type, amount_cents, notes) VALUES (
        booking_record.customer_id,
        'CREDIT_REFERRED',
        referred_amount_cents,
        'Welcome credit for being referred'
    );
    
    -- Log reward issuance
    INSERT INTO attribution_events (event, payload) VALUES (
        'REFERRAL_REWARDED',
        jsonb_build_object(
            'booking_id', input_booking_id,
            'referrer_customer_id', booking_record.referrer_customer_id,
            'referred_customer_id', booking_record.customer_id,
            'referrer_amount_cents', referrer_amount_cents,
            'referred_amount_cents', referred_amount_cents
        )
    );
END;
$$;