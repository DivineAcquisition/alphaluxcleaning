-- Fix the role for divineacquisition.io@gmail.com
UPDATE user_roles 
SET role = 'admin'::app_role 
WHERE user_id = '4692dd72-1675-4d2b-9ff6-2c2d4a07856b';