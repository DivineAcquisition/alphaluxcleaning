-- Remove broken Airtable sync trigger and function
DROP TRIGGER IF EXISTS trigger_airtable_sync_orders ON orders;
DROP FUNCTION IF EXISTS public.trigger_airtable_sync();

-- Add webhook test orders table for admin testing
CREATE TABLE IF NOT EXISTS public.webhook_test_orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  service_type text NOT NULL,
  amount numeric(10,2) NOT NULL,
  status text DEFAULT 'pending',
  test_data jsonb DEFAULT '{}',
  webhook_response jsonb,
  webhook_status text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhook_test_orders ENABLE ROW LEVEL SECURITY;

-- Policy for admins only
CREATE POLICY "Admins can manage webhook test orders" 
ON public.webhook_test_orders 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));