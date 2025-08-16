-- Fix critical security vulnerabilities in payment and financial data access

-- 1. Drop the overly permissive "System can manage payments" policy
DROP POLICY IF EXISTS "System can manage payments" ON public.subcontractor_payments;

-- 2. Create a secure service role policy for system operations (edge functions only)
-- This ensures only authenticated service/edge functions can manage payments, not public users
CREATE POLICY "Service role can manage payments" 
ON public.subcontractor_payments 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Add logging trigger for payment data modifications (not SELECT - unsupported)
CREATE OR REPLACE FUNCTION public.log_payment_modifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Log modifications to payment data
  IF TG_OP = 'UPDATE' THEN
    PERFORM public.log_security_event(
      auth.uid(),
      'payment_data_modified',
      'subcontractor_payments',
      NEW.id::text,
      to_jsonb(OLD),
      to_jsonb(NEW),
      NULL,
      NULL,
      'high'
    );
    RETURN NEW;
  END IF;
  
  -- Log new payment creation
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_security_event(
      auth.uid(),
      'payment_data_created',
      'subcontractor_payments',
      NEW.id::text,
      NULL,
      to_jsonb(NEW),
      NULL,
      NULL,
      'high' 
    );
    RETURN NEW;
  END IF;
  
  -- Log payment deletion
  IF TG_OP = 'DELETE' THEN
    PERFORM public.log_security_event(
      auth.uid(),
      'payment_data_deleted',
      'subcontractor_payments',
      OLD.id::text,
      to_jsonb(OLD),
      NULL,
      NULL,
      NULL,
      'critical'
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for payment modifications logging
DROP TRIGGER IF EXISTS log_payment_modifications_trigger ON public.subcontractor_payments;
CREATE TRIGGER log_payment_modifications_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.subcontractor_payments
  FOR EACH ROW EXECUTE FUNCTION public.log_payment_modifications();

-- 4. Enhance the subcontractor payment access policy with better security
DROP POLICY IF EXISTS "Subcontractors can view their own payments" ON public.subcontractor_payments;
CREATE POLICY "Subcontractors can view their own payments" 
ON public.subcontractor_payments 
FOR SELECT 
TO authenticated
USING (
  -- Only allow if user is authenticated and accessing their own payments
  auth.uid() IS NOT NULL 
  AND subcontractor_id IN (
    SELECT s.id 
    FROM public.subcontractors s 
    WHERE s.user_id = auth.uid()
  )
);

-- 5. Create a secure function for payment operations by admins
CREATE OR REPLACE FUNCTION public.admin_can_manage_payments()
RETURNS BOOLEAN AS $$
BEGIN
  -- Verify admin access and log the attempt
  IF NOT public.has_role(auth.uid(), 'super_admin'::app_role) THEN
    PERFORM public.log_security_event(
      auth.uid(),
      'unauthorized_payment_admin_access',
      'subcontractor_payments',
      NULL,
      NULL,
      jsonb_build_object('attempted_at', now()),
      NULL,
      NULL,
      'critical'
    );
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Update admin policy to use the secure function
DROP POLICY IF EXISTS "Admins can manage all payments" ON public.subcontractor_payments;
CREATE POLICY "Admins can manage all payments" 
ON public.subcontractor_payments 
FOR ALL 
TO authenticated
USING (public.admin_can_manage_payments())
WITH CHECK (public.admin_can_manage_payments());