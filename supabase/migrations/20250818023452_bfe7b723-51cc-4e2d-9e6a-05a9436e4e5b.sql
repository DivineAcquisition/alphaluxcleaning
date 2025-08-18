-- Fix the handle_customer_profile_creation function to handle existing profiles
CREATE OR REPLACE FUNCTION public.handle_customer_profile_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create basic profile record for customer, ignore if already exists
  INSERT INTO public.profiles (id, full_name, role_display_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'customer'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role_display_name = COALESCE(EXCLUDED.role_display_name, profiles.role_display_name),
    updated_at = now();
  
  RETURN NEW;
END;
$function$;