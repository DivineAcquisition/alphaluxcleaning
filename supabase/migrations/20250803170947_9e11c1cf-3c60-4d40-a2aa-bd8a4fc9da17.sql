-- Add unique constraint on role column in auth_redirects table
ALTER TABLE public.auth_redirects ADD CONSTRAINT auth_redirects_role_unique UNIQUE (role);

-- Add auth redirects for the new roles
INSERT INTO public.auth_redirects (role, redirect_path) VALUES
('owner', '/admin-dashboard'),
('office_manager', '/admin-dashboard/schedule'),
('field_cleaner', '/subcontractor-dashboard'),
('recurring_cleaner', '/subcontractor-dashboard'),
('subcontractor_partner', '/subcontractor-dashboard'),
('client', '/my-services')
ON CONFLICT (role) DO UPDATE SET redirect_path = EXCLUDED.redirect_path;