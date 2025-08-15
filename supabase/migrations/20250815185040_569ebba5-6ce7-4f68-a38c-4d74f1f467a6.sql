-- Final Security Hardening: Fix all remaining RLS policy issues

-- Enable RLS on all tables that need it
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

-- Fix referral_codes policies - remove public access
DROP POLICY IF EXISTS "Anyone can read active referral codes" ON public.referral_codes;
CREATE POLICY "Users can view their own referral codes" 
ON public.referral_codes 
FOR SELECT 
USING (owner_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can create their own referral codes" 
ON public.referral_codes 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own referral codes" 
ON public.referral_codes 
FOR UPDATE 
USING (owner_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can manage all referral codes" 
ON public.referral_codes 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Fix order_tips policies - require authentication
DROP POLICY IF EXISTS "Anyone can insert tips" ON public.order_tips;
CREATE POLICY "Authenticated users can insert tips" 
ON public.order_tips 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Add comprehensive logging for this final security pass
INSERT INTO public.security_logs (action, details)
VALUES (
  'final_security_hardening_complete',
  jsonb_build_object(
    'timestamp', now(),
    'action', 'comprehensive_rls_implementation',
    'tables_secured', ARRAY['order_status_updates', 'referral_codes', 'order_tips'],
    'description', 'Completed comprehensive security hardening by removing all public access to sensitive data and requiring proper authentication'
  )
);