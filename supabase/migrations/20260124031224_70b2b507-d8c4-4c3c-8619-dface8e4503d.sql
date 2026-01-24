-- Add column to track the Stripe balance invoice ID
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS stripe_balance_invoice_id text;