-- Create function to assign default customer role to new users
CREATE OR REPLACE FUNCTION public.assign_customer_role_to_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert customer role for new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically assign customer role on user signup
DROP TRIGGER IF EXISTS assign_customer_role_trigger ON auth.users;
CREATE TRIGGER assign_customer_role_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_customer_role_to_new_user();

-- Create function to handle user profile creation for customers
CREATE OR REPLACE FUNCTION public.handle_customer_profile_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create basic profile record for customer
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger for profile creation
DROP TRIGGER IF EXISTS handle_customer_profile_trigger ON auth.users;
CREATE TRIGGER handle_customer_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_customer_profile_creation();