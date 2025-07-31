-- Assign super_admin role to the current user
INSERT INTO public.user_roles (user_id, role) 
VALUES ('4692dd72-1675-4d2b-9ff6-2c2d4a07856b', 'super_admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;