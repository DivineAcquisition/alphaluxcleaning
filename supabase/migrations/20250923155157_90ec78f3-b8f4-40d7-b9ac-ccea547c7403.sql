-- Add missing columns to customers table for OTP functionality
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS company_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000',
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create customer portal sessions table for customer OTP functionality
CREATE TABLE IF NOT EXISTS public.customer_portal_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on customer portal sessions
ALTER TABLE public.customer_portal_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for customer portal sessions
CREATE POLICY "Customers can view their own sessions" 
ON public.customer_portal_sessions 
FOR SELECT 
USING (customer_id IN (
  SELECT id FROM public.customers WHERE user_id = auth.uid()
));

CREATE POLICY "Service can manage all sessions" 
ON public.customer_portal_sessions 
FOR ALL 
USING (true);