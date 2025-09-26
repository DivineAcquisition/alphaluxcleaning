-- Add referral system columns to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS referral_code text,
ADD COLUMN IF NOT EXISTS referral_link text;

-- Create unique index on referral_code to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_referral_code 
ON public.customers(referral_code) 
WHERE referral_code IS NOT NULL;