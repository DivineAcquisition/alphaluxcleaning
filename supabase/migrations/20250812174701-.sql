-- CRITICAL SECURITY FIX: Remove universal admin backdoor and add missing RLS policies

-- Phase 1: Add missing RLS policies for tables without proper access controls

-- Companies table - Admin/owner access only
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.companies;
CREATE POLICY "Admins can manage companies"
ON public.companies
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Contracts table - Admin/owner access only  
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.contracts;
CREATE POLICY "Admins can manage contracts"
ON public.contracts
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Documents table - Role-based access with confidentiality checks
CREATE POLICY "Users can view non-confidential documents"
ON public.documents
FOR SELECT
TO authenticated
USING (NOT is_confidential OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can manage all documents"
ON public.documents
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Invoices table - Admin access only
CREATE POLICY "Admins can manage invoices"
ON public.invoices
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Locations table - Admin/owner access only
CREATE POLICY "Admins can manage locations"
ON public.locations
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Payments table - Admin access + user-specific policies
CREATE POLICY "Admins can manage payments"
ON public.payments
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Revenue entries table - Admin/owner access only
CREATE POLICY "Admins can manage revenue entries"
ON public.revenue_entries
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Services table - Admin access + assigned user policies
CREATE POLICY "Admins can manage services"
ON public.services
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Subcontractors can view assigned services"
ON public.services
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.subcontractors s
    WHERE s.user_id = auth.uid()
    AND s.id = ANY(services.team_members::uuid[])
  )
);

-- Deals table - Users can only view deals assigned to them
CREATE POLICY "Users can manage assigned deals"
ON public.deals
FOR ALL
TO authenticated
USING (assigned_to = auth.uid() OR has_role(auth.uid(), 'super_admin'::app_role));

-- Phase 2: Secure the create-test-admin function by disabling it in production
-- Add a check to prevent usage in production environments
CREATE OR REPLACE FUNCTION public.create_test_admin_secure(p_secret_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_allowed_keys text[] := ARRAY['DEV_ADMIN_KEY_2024', 'LOCAL_TEST_KEY'];
BEGIN
  -- Only allow in development/test environments with valid secret key
  IF p_secret_key IS NULL OR NOT (p_secret_key = ANY(v_allowed_keys)) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized access. This function is disabled in production.'
    );
  END IF;
  
  -- Log the attempt for security monitoring
  INSERT INTO public.security_logs (action, details, ip_address)
  VALUES (
    'admin_creation_attempt',
    jsonb_build_object('secret_key_provided', p_secret_key IS NOT NULL),
    inet_client_addr()
  );
  
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Admin creation has been disabled for security. Use Supabase Auth dashboard instead.'
  );
END;
$$;

-- Revoke public access to admin creation functions
REVOKE ALL ON FUNCTION public.create_test_admin_secure(text) FROM public;
GRANT EXECUTE ON FUNCTION public.create_test_admin_secure(text) TO service_role;

-- Phase 3: Add audit logging for sensitive operations
CREATE OR REPLACE FUNCTION public.log_admin_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log admin access to sensitive tables
  INSERT INTO public.security_logs (
    user_id,
    action,
    resource,
    details,
    ip_address
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    row_to_json(NEW),
    inet_client_addr()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add triggers for audit logging on sensitive tables
DROP TRIGGER IF EXISTS audit_companies ON public.companies;
CREATE TRIGGER audit_companies
  AFTER INSERT OR UPDATE OR DELETE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_access();

DROP TRIGGER IF EXISTS audit_payments ON public.payments;
CREATE TRIGGER audit_payments
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_access();