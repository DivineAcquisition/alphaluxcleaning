-- Add new fields to bookings table for simplified flow
-- These fields will coexist with the existing fields for backwards compatibility

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS address_line1 text,
ADD COLUMN IF NOT EXISTS address_line2 text,
ADD COLUMN IF NOT EXISTS home_size text,
ADD COLUMN IF NOT EXISTS offer_type text,
ADD COLUMN IF NOT EXISTS offer_name text,
ADD COLUMN IF NOT EXISTS base_price numeric,
ADD COLUMN IF NOT EXISTS visit_count integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS preferred_date date,
ADD COLUMN IF NOT EXISTS preferred_time_block text,
ADD COLUMN IF NOT EXISTS notes text;

-- Add index for faster lookups by offer type
CREATE INDEX IF NOT EXISTS idx_bookings_offer_type ON public.bookings(offer_type);

-- Add comment to document the new fields
COMMENT ON COLUMN public.bookings.offer_type IS 'Type of offer: tester_deep_clean or 90_day_plan';
COMMENT ON COLUMN public.bookings.offer_name IS 'Display name for the selected offer';
COMMENT ON COLUMN public.bookings.base_price IS 'Base price of the selected offer';
COMMENT ON COLUMN public.bookings.visit_count IS 'Number of visits included (1 for tester, 4 for 90-day plan)';
COMMENT ON COLUMN public.bookings.is_recurring IS 'Whether this is a recurring plan (false for tester, true for 90-day)';
