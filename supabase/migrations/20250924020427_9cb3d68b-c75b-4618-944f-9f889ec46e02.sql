-- Create function to manually add admin user (for development/setup)
CREATE OR REPLACE FUNCTION public.create_admin_user(
  p_email TEXT,
  p_role TEXT DEFAULT 'admin'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Generate a UUID for the user (simulating user creation)
  v_user_id := gen_random_uuid();
  
  -- Insert into admin_users table
  INSERT INTO public.admin_users (user_id, email, role, status)
  VALUES (v_user_id, p_email, p_role, 'active')
  ON CONFLICT (email) DO UPDATE SET
    role = p_role,
    status = 'active';
    
  -- Also add to admin_allowlist if not exists
  INSERT INTO public.admin_allowlist (email)
  VALUES (p_email)
  ON CONFLICT (email) DO NOTHING;
  
  -- Log the action
  INSERT INTO public.admin_audit_logs (user_id, email, action, metadata)
  VALUES (v_user_id, p_email, 'admin_user_created', jsonb_build_object('role', p_role));
  
  RETURN v_user_id;
END;
$$;