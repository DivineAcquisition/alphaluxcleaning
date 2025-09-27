-- Create admin user directly for info@alphaluxclean.com
INSERT INTO public.admin_users (user_id, email, role, status) 
VALUES (
  gen_random_uuid(), 
  'info@alphaluxclean.com', 
  'admin', 
  'active'
) 
ON CONFLICT (email) DO UPDATE SET 
  role = 'admin',
  status = 'active';

-- Also add to allowlist
INSERT INTO public.admin_allowlist (email) 
VALUES ('info@alphaluxclean.com') 
ON CONFLICT (email) DO NOTHING;

-- Log the creation
INSERT INTO public.admin_audit_logs (user_id, email, action, metadata)
SELECT user_id, email, 'manual_admin_user_created', jsonb_build_object('role', 'admin')
FROM public.admin_users 
WHERE email = 'info@alphaluxclean.com';