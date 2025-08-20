-- Fix the create-payment-intent function error by ensuring payment_status column exists
-- First check if the column exists, if not add it
DO $$ 
BEGIN
    -- Check if payment_status column exists in orders table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND table_schema = 'public' 
        AND column_name = 'payment_status'
    ) THEN
        -- Add payment_status column if it doesn't exist
        ALTER TABLE public.orders 
        ADD COLUMN payment_status TEXT DEFAULT 'pending';
        
        -- Create index for performance
        CREATE INDEX IF NOT EXISTS idx_orders_payment_status 
        ON public.orders (payment_status);
    END IF;
END $$;