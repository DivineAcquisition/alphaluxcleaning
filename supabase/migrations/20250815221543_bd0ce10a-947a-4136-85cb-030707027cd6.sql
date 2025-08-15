-- Enhanced Security Policies for Subcontractors Table
-- This migration adds additional security layers and audit logging

-- First, let's create an enhanced security function for subcontractor data access
CREATE OR REPLACE FUNCTION public.can_access_subcontractor_data(p_subcontractor_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log the access attempt for security monitoring
  PERFORM public.log_security_event(
    auth.uid(),
    'subcontractor_data_access_attempt',
    'subcontractors',
    p_subcontractor_user_id::text,
    NULL,
    jsonb_build_object(
      'target_user_id', p_subcontractor_user_id,
      'accessing_user_id', auth.uid(),
      'timestamp', now()
    ),
    NULL,
    NULL,
    CASE 
      WHEN auth.uid() != p_subcontractor_user_id AND NOT public.has_role(auth.uid(), 'super_admin'::app_role) 
      THEN 'high'
      ELSE 'low'
    END
  );
  
  -- Only allow access if:
  -- 1. User is accessing their own data, OR
  -- 2. User is a super admin, AND
  -- 3. User is authenticated (not null)
  RETURN (
    auth.uid() IS NOT NULL AND (
      auth.uid() = p_subcontractor_user_id OR 
      public.has_role(auth.uid(), 'super_admin'::app_role)
    )
  );
END;
$$;

-- Drop existing policies to replace with enhanced ones
DROP POLICY IF EXISTS "subcontractors_secure_select" ON public.subcontractors;
DROP POLICY IF EXISTS "subcontractors_secure_update" ON public.subcontractors;
DROP POLICY IF EXISTS "subcontractors_secure_insert" ON public.subcontractors;
DROP POLICY IF EXISTS "subcontractors_secure_delete" ON public.subcontractors;

-- Enhanced SELECT policy with additional security checks
CREATE POLICY "Enhanced subcontractor data access - SELECT" 
ON public.subcontractors 
FOR SELECT 
USING (
  public.can_access_subcontractor_data(user_id)
);

-- Enhanced UPDATE policy with audit logging
CREATE POLICY "Enhanced subcontractor data access - UPDATE" 
ON public.subcontractors 
FOR UPDATE 
USING (
  public.can_access_subcontractor_data(user_id)
)
WITH CHECK (
  public.can_access_subcontractor_data(user_id)
);

-- Enhanced INSERT policy - only allow if user_id matches auth user or admin
CREATE POLICY "Enhanced subcontractor data access - INSERT" 
ON public.subcontractors 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'super_admin'::app_role)
  )
);

-- Strict DELETE policy - only super admins can delete
CREATE POLICY "Enhanced subcontractor data access - DELETE" 
ON public.subcontractors 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND 
  public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- Create a function to mask sensitive subcontractor data for non-authorized users
CREATE OR REPLACE FUNCTION public.get_subcontractor_summary_safe(p_subcontractor_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_subcontractor_data jsonb;
BEGIN
  -- Only return limited, non-sensitive information for general access
  SELECT jsonb_build_object(
    'id', id,
    'full_name', 
      CASE 
        WHEN public.can_access_subcontractor_data(user_id) THEN full_name
        ELSE public.mask_sensitive_field(full_name)
      END,
    'city', city,
    'state', state,
    'is_available', is_available,
    'tier_level', tier_level,
    'rating', rating,
    'review_count', review_count,
    'completed_jobs_count', completed_jobs_count
  ) INTO v_subcontractor_data
  FROM public.subcontractors
  WHERE id = p_subcontractor_id;
  
  RETURN COALESCE(v_subcontractor_data, '{"error": "Subcontractor not found"}'::jsonb);
END;
$$;

-- Create trigger to automatically log sensitive data changes
CREATE OR REPLACE FUNCTION public.log_subcontractor_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log any changes to sensitive fields
  IF TG_OP = 'UPDATE' THEN
    -- Check if sensitive fields were modified
    IF (OLD.email != NEW.email OR 
        OLD.phone != NEW.phone OR 
        OLD.address != NEW.address OR
        OLD.stripe_customer_id != NEW.stripe_customer_id OR
        OLD.subscription_id != NEW.subscription_id) THEN
      
      PERFORM public.log_security_event(
        auth.uid(),
        'sensitive_subcontractor_data_modified',
        'subcontractors',
        NEW.id::text,
        to_jsonb(OLD),
        to_jsonb(NEW),
        NULL,
        NULL,
        'high'
      );
    END IF;
    RETURN NEW;
  END IF;
  
  -- Log new subcontractor creation
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_security_event(
      auth.uid(),
      'subcontractor_profile_created',
      'subcontractors',
      NEW.id::text,
      NULL,
      to_jsonb(NEW),
      NULL,
      NULL,
      'medium'
    );
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create trigger for subcontractor data changes
DROP TRIGGER IF EXISTS trigger_log_subcontractor_changes ON public.subcontractors;
CREATE TRIGGER trigger_log_subcontractor_changes
  AFTER INSERT OR UPDATE ON public.subcontractors
  FOR EACH ROW EXECUTE FUNCTION public.log_subcontractor_changes();

-- Add additional constraint to ensure user_id is never null for new records
ALTER TABLE public.subcontractors 
ADD CONSTRAINT subcontractors_user_id_not_null 
CHECK (user_id IS NOT NULL);

-- Create index on user_id for better performance of security checks
CREATE INDEX IF NOT EXISTS idx_subcontractors_user_id_security 
ON public.subcontractors(user_id) 
WHERE user_id IS NOT NULL;