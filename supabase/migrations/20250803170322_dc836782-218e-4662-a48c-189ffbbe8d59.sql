-- Update the app_role enum to include the new roles for BayAreaCleaningPros
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'office_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'field_cleaner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'recurring_cleaner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'subcontractor_partner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';

-- Update auth_redirects table to include new role redirects
INSERT INTO public.auth_redirects (role, redirect_path) VALUES
('owner', '/admin-dashboard'),
('office_manager', '/admin-dashboard/schedule'),
('field_cleaner', '/subcontractor-dashboard'),
('recurring_cleaner', '/subcontractor-dashboard'),
('subcontractor_partner', '/subcontractor-dashboard'),
('client', '/my-services')
ON CONFLICT (role) DO UPDATE SET redirect_path = EXCLUDED.redirect_path;