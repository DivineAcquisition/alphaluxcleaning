-- Grant super_admin role to current user to access all pages
INSERT INTO public.user_roles (user_id, role)
SELECT auth.uid(), 'super_admin'::app_role
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Also ensure enterprise_client role for broader access
INSERT INTO public.user_roles (user_id, role)
SELECT auth.uid(), 'enterprise_client'::app_role
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;