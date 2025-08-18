-- Fix the handle_customer_profile_creation function to use correct column names
CREATE OR REPLACE FUNCTION public.handle_customer_profile_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create basic profile record for customer
  INSERT INTO public.profiles (id, full_name, role_display_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;