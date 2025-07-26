-- Add recurring service management fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurring_frequency TEXT,
ADD COLUMN IF NOT EXISTS next_service_date DATE,
ADD COLUMN IF NOT EXISTS service_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS paused_until DATE,
ADD COLUMN IF NOT EXISTS preferred_time TEXT,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS retention_discount_offered BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS retention_discount_accepted BOOLEAN DEFAULT false;

-- Create a table for service modifications/history
CREATE TABLE IF NOT EXISTS public.service_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  modification_type TEXT NOT NULL, -- 'reschedule', 'pause', 'resume', 'cancel', 'discount_offer'
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on service_modifications
ALTER TABLE public.service_modifications ENABLE ROW LEVEL SECURITY;

-- Create policies for service_modifications
CREATE POLICY "Users can view their own service modifications" 
ON public.service_modifications 
FOR SELECT 
USING (
  order_id IN (
    SELECT id FROM public.orders WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own service modifications" 
ON public.service_modifications 
FOR INSERT 
WITH CHECK (
  order_id IN (
    SELECT id FROM public.orders WHERE user_id = auth.uid()
  )
);

-- Update orders table RLS to allow customers to update their own recurring service details
CREATE POLICY "Customers can update their own recurring services" 
ON public.orders 
FOR UPDATE 
USING (user_id = auth.uid());