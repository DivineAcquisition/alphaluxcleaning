-- Comprehensive Security Fix: Add missing RLS policies for sensitive data tables

-- Fix commercial_estimates table
ALTER TABLE public.commercial_estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit commercial estimates" 
ON public.commercial_estimates 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own estimates by email" 
ON public.commercial_estimates 
FOR SELECT 
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can manage all commercial estimates" 
ON public.commercial_estimates 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Add missing RLS for notification_deliveries (already has some policies but ensure comprehensive coverage)
CREATE POLICY "Admins can manage all notification deliveries" 
ON public.notification_deliveries 
FOR UPDATE 
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can delete notification deliveries" 
ON public.notification_deliveries 
FOR DELETE 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Log comprehensive security fixes
INSERT INTO public.security_logs (action, details)
VALUES (
  'comprehensive_security_hardening',
  jsonb_build_object(
    'timestamp', now(),
    'action', 'added_missing_rls_policies',
    'tables_secured', ARRAY['commercial_estimates', 'notification_deliveries'],
    'description', 'Added comprehensive RLS policies to protect sensitive customer and notification data'
  )
);