-- Create a function to set up initial admin users
CREATE OR REPLACE FUNCTION create_initial_admin_users()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_emails TEXT[] := ARRAY[
    'admin1@bayareacleaningpros.com',
    'ellie@bayareacleaningpros.com', 
    'divineacquisition.io@gmail.com'
  ];
  email_address TEXT;
  result JSONB := '[]'::jsonb;
BEGIN
  -- For each admin email, create a simple record that shows they should be admins
  FOREACH email_address IN ARRAY admin_emails
  LOOP
    -- Insert a placeholder record (we'll need to create these users manually through Supabase auth)
    INSERT INTO public.referral_codes (
      code, 
      owner_email, 
      owner_name,
      reward_type,
      max_uses,
      is_active
    ) VALUES (
      'ADMIN_' || upper(substring(md5(email_address), 1, 6)),
      email_address,
      CASE 
        WHEN email_address = 'admin1@bayareacleaningpros.com' THEN 'Admin User 1'
        WHEN email_address = 'ellie@bayareacleaningpros.com' THEN 'Ellie'
        WHEN email_address = 'divineacquisition.io@gmail.com' THEN 'Divine Acquisition'
      END,
      'admin_setup',
      1,
      false
    )
    ON CONFLICT (code) DO NOTHING;
    
    result := result || jsonb_build_object(
      'email', email_address,
      'status', 'marked_for_admin_setup'
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Admin users marked for setup',
    'users', result
  );
END;
$$;