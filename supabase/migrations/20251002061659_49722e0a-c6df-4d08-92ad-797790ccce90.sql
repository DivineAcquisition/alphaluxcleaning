-- Add customer metadata fields for promotional tracking
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS recurrence_plan TEXT DEFAULT 'ONE_TIME',
ADD COLUMN IF NOT EXISTS first_clean_discount_used BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deep_clean_reward_code TEXT,
ADD COLUMN IF NOT EXISTS deep_clean_reward_expires TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_deep_clean_answer TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for reward code lookups
CREATE INDEX IF NOT EXISTS idx_customers_reward_code ON customers(deep_clean_reward_code) WHERE deep_clean_reward_code IS NOT NULL;

-- Add promo code metadata for deep clean rewards
ALTER TABLE promo_codes
ADD COLUMN IF NOT EXISTS service_type_restriction TEXT,
ADD COLUMN IF NOT EXISTS issued_to_customer_id UUID REFERENCES customers(id),
ADD COLUMN IF NOT EXISTS reward_type TEXT;

-- Create index for customer-specific promo codes
CREATE INDEX IF NOT EXISTS idx_promo_codes_customer ON promo_codes(issued_to_customer_id) WHERE issued_to_customer_id IS NOT NULL;

-- Add booking metadata for promotional tracking
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS promo_applied TEXT,
ADD COLUMN IF NOT EXISTS reward_code_issued TEXT,
ADD COLUMN IF NOT EXISTS commitment_months INTEGER,
ADD COLUMN IF NOT EXISTS deep_clean_recommendation_shown BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deep_clean_last_answer TEXT;