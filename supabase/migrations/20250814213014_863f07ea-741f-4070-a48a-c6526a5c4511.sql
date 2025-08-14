-- Fix Security Issue: Set secure search_path for all SECURITY DEFINER functions
-- This prevents potential privilege escalation attacks

-- Fix get_subcontractors_admin_summary function (already created but needs to be recreated)
CREATE OR REPLACE FUNCTION public.get_subcontractors_admin_summary()
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  phone text,
  city text,
  state text,
  is_available boolean,
  tier_level integer,
  rating numeric,
  completed_jobs_count integer,
  review_count integer,
  subscription_status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only allow admins to call this function
  IF NOT public.has_role(auth.uid(), 'super_admin'::public.app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Return limited data set (excludes sensitive financial info like Stripe IDs, addresses, earnings)
  RETURN QUERY
  SELECT 
    s.id,
    s.full_name,
    s.email,
    s.phone,
    s.city,
    s.state,
    s.is_available,
    s.tier_level,
    s.rating,
    s.completed_jobs_count,
    s.review_count,
    s.subscription_status,
    s.created_at,
    s.updated_at
  FROM public.subcontractors s;
END;
$$;

-- Fix has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Fix get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS public.app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
    
    -- Assign default customer role unless specified otherwise
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'customer'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Log security fix
INSERT INTO public.security_logs (action, details)
VALUES (
  'security_definer_functions_search_path_fixed',
  jsonb_build_object(
    'timestamp', now(),
    'security_issue', 'mutable_search_path_in_security_definer_functions',
    'functions_fixed', ARRAY[
      'get_subcontractors_admin_summary',
      'has_role', 
      'get_user_role',
      'handle_new_user'
    ],
    'description', 'Fixed security vulnerability where SECURITY DEFINER functions had mutable search_path, which could lead to privilege escalation attacks. All functions now use immutable search_path = empty string.'
  )
);