-- Create test users and roles for subcontractor access
-- This migration sets up proper test data for accessing subcontractor pages

-- First, ensure we have the necessary roles for existing admin users
INSERT INTO public.user_roles (user_id, role) 
SELECT 
  id,
  'super_admin'::app_role
FROM auth.users 
WHERE email IN ('admin1@bayareacleaningpros.com', 'ellie@bayareacleaningpros.com', 'divineacquisition.io@gmail.com')
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = auth.users.id AND ur.role = 'super_admin'::app_role
);

-- Add subcontractor role for testing
INSERT INTO public.user_roles (user_id, role) 
SELECT 
  id,
  'subcontractor'::app_role
FROM auth.users 
WHERE email IN ('admin1@bayareacleaningpros.com', 'ellie@bayareacleaningpros.com')
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = auth.users.id AND ur.role = 'subcontractor'::app_role
);

-- Create test subcontractor profiles linked to existing admin users
INSERT INTO public.subcontractors (
  user_id,
  full_name,
  email,
  phone,
  address,
  city,
  state,
  zip_code,
  hourly_rate,
  monthly_fee,
  tier_level,
  split_tier,
  is_available,
  subscription_status,
  review_count,
  completed_jobs_count,
  rating
) 
SELECT 
  u.id,
  CASE 
    WHEN u.email = 'admin1@bayareacleaningpros.com' THEN 'Test Admin Subcontractor'
    WHEN u.email = 'ellie@bayareacleaningpros.com' THEN 'Ellie Test Subcontractor'
  END,
  u.email,
  '(555) 123-4567',
  '123 Test Street',
  'San Francisco',
  'CA',
  '94102',
  18.00,
  50.00,
  2,
  'Tier 2 - Professional',
  true,
  'active',
  15,
  22,
  4.8
FROM auth.users u
WHERE u.email IN ('admin1@bayareacleaningpros.com', 'ellie@bayareacleaningpros.com')
AND NOT EXISTS (
  SELECT 1 FROM public.subcontractors s WHERE s.user_id = u.id
);