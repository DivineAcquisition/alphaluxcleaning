-- Create admin users directly in auth.users table
-- Note: These users will need to reset their passwords to access the system

-- First, let's create the admin accounts
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES 
(
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin1@bayareacleaningpros.com',
  crypt('temppassword123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
),
(
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'ellie@bayareacleaningpros.com',
  crypt('temppassword123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
),
(
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'divineacquisition.io@gmail.com',
  crypt('temppassword123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (email) DO NOTHING;

-- Add admin roles for these users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users 
WHERE email IN (
  'admin1@bayareacleaningpros.com',
  'ellie@bayareacleaningpros.com', 
  'divineacquisition.io@gmail.com'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Create profiles for these users
INSERT INTO public.profiles (id, full_name, is_active)
SELECT id, 
  CASE 
    WHEN email = 'admin1@bayareacleaningpros.com' THEN 'Admin User 1'
    WHEN email = 'ellie@bayareacleaningpros.com' THEN 'Ellie'
    WHEN email = 'divineacquisition.io@gmail.com' THEN 'Divine Acquisition'
  END,
  true
FROM auth.users 
WHERE email IN (
  'admin1@bayareacleaningpros.com',
  'ellie@bayareacleaningpros.com', 
  'divineacquisition.io@gmail.com'
)
ON CONFLICT (id) DO NOTHING;