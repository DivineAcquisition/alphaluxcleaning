
-- Make handle_new_user a no-op to avoid duplicate profile inserts.
-- This preserves the auth.users trigger while removing conflicting logic.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- No operation here:
  -- - Profile creation/upsert is handled by handle_customer_profile_creation()
  -- - Default role assignment is handled by assign_customer_role_to_new_user()
  RETURN NEW;
END;
$function$;
