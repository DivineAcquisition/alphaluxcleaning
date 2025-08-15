-- Add setup_intent_id column to orders table for "pay after service" bookings
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS stripe_setup_intent_id TEXT;