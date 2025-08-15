-- Final Security Hardening: Fix remaining RLS policy issues (corrected)

-- Enable RLS on tables that need it
ALTER TABLE public.order_status_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

-- Fix order_status_updates policies
DROP POLICY IF EXISTS "Anyone can view status updates for their orders" ON public.order_status_updates;
CREATE POLICY "Customers can view their order status updates" 
ON public.order_status_updates 
FOR SELECT 
USING (
  order_id IN (
    SELECT id FROM public.orders 
    WHERE user_id = auth.uid() OR customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

CREATE POLICY "Admins can manage all status updates" 
ON public.order_status_updates 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Fix referral_codes policies - drop all existing policies first
DROP POLICY IF EXISTS "Anyone can read active referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Users can view their own referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Users can create their own referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Users can update their own referral codes" ON public.referral_codes;

-- Create new secure referral_codes policies
CREATE POLICY "Users can view own referral codes" 
ON public.referral_codes 
FOR SELECT 
USING (owner_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Authenticated users can create referral codes" 
ON public.referral_codes 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own referral codes" 
ON public.referral_codes 
FOR UPDATE 
USING (owner_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Fix order_tips policies
DROP POLICY IF EXISTS "Anyone can insert tips" ON public.order_tips;
CREATE POLICY "Authenticated users can insert tips" 
ON public.order_tips 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Log successful completion
INSERT INTO public.security_logs (action, details)
VALUES (
  'security_hardening_phase_complete',
  jsonb_build_object(
    'timestamp', now(),
    'action', 'secured_sensitive_tables',
    'tables_secured', ARRAY['order_status_updates', 'referral_codes', 'order_tips'],
    'description', 'Successfully secured sensitive data tables with proper authentication requirements'
  )
);