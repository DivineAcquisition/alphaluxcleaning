-- Add prepayment discount fields to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS prepayment_discount_applied boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS prepayment_discount_amount integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status text;

-- Add bundle commitment fields to recurring_services table
ALTER TABLE public.recurring_services
ADD COLUMN IF NOT EXISTS bundle_code text,
ADD COLUMN IF NOT EXISTS commitment_months integer;