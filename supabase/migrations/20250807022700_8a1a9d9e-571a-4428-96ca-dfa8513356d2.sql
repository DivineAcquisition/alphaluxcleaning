-- Simple migration to ensure admin users have the necessary roles
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