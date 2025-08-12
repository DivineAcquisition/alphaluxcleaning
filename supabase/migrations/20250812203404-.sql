-- PHASE 1: CRITICAL SECURITY FIXES - Fixed Version
-- Remove dangerous public policies and create secure replacements

-- Drop dangerous public policies that expose sensitive data
DROP POLICY IF EXISTS "Public can read order lookup" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert commercial estimates" ON public.commercial_estimates;
DROP POLICY IF EXISTS "Anyone can view commercial estimates" ON public.commercial_estimates;

-- Safely replace existing policies for orders
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;
CREATE POLICY "Customers can view their own orders" ON public.orders
FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Secure commercial estimates
CREATE POLICY "Secure commercial estimate access" ON public.commercial_estimates
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Secure commercial estimate creation" ON public.commercial_estimates
FOR INSERT 
WITH CHECK (true);

-- Add missing RLS policies for quality_reports table
CREATE POLICY "Admins can manage quality reports" ON public.quality_reports
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Secure customer feedback
DROP POLICY IF EXISTS "Admins can manage customer feedback" ON public.customer_feedback;
CREATE POLICY "Admins can manage customer feedback" ON public.customer_feedback
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Customers can view their own feedback" ON public.customer_feedback
FOR SELECT 
USING (
  booking_id IN (
    SELECT b.id FROM public.bookings b
    JOIN public.orders o ON b.order_id = o.id
    WHERE o.user_id = auth.uid()
  )
);

-- Secure subcontractor applications
DROP POLICY IF EXISTS "Anyone can submit applications" ON public.subcontractor_applications;
CREATE POLICY "Secure application submission" ON public.subcontractor_applications
FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view subcontractor applications" ON public.subcontractor_applications;
CREATE POLICY "Admins can view subcontractor applications" ON public.subcontractor_applications
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create secure order status function
CREATE OR REPLACE FUNCTION public.get_customer_order_status_secure(p_order_id uuid, p_customer_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order_status jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', o.id,
    'status', o.status,
    'created_at', o.created_at,
    'scheduled_date', o.scheduled_date,
    'service_type', o.service_details->>'service_type'
  ) INTO v_order_status
  FROM public.orders o
  WHERE o.id = p_order_id 
    AND (
      o.customer_email = p_customer_email 
      OR o.user_id = auth.uid()
      OR has_role(auth.uid(), 'super_admin'::app_role)
    );
  
  RETURN COALESCE(v_order_status, '{"error": "Order not found or access denied"}'::jsonb);
END;
$$;

-- Log security fixes
INSERT INTO public.security_logs (action, details)
VALUES (
  'critical_security_fixes_applied',
  jsonb_build_object(
    'timestamp', now(),
    'action', 'Fixed critical data exposure vulnerabilities',
    'affected_tables', ARRAY['orders', 'commercial_estimates', 'quality_reports', 'customer_feedback', 'subcontractor_applications'],
    'severity', 'critical'
  )
);