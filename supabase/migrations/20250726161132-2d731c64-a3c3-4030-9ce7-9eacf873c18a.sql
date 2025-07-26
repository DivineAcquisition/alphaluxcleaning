-- Update current user (Malik) role from customer to admin
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = '4b1d3711-8d12-4d2e-a93c-581351307795' AND role = 'customer';

-- Insert admin role for current user if no role exists yet
INSERT INTO public.user_roles (user_id, role)
VALUES ('4b1d3711-8d12-4d2e-a93c-581351307795', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Note: For the owner Maurisa Alexis Louis (admin1@bayareacleaningpros.com), 
-- she will need to sign up first through the auth system, then we can assign her admin role.
-- The system will automatically assign 'customer' role on signup via the handle_new_user() trigger,
-- then we can update it to 'admin' after she creates her account.