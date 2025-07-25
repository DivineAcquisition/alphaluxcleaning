-- Fix remaining database functions with proper search_path

-- Fix check_job_drop_restrictions function
CREATE OR REPLACE FUNCTION public.check_job_drop_restrictions(p_subcontractor_id uuid, p_service_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_drops_count INTEGER;
  v_within_48hrs BOOLEAN;
  v_hours_before INTEGER;
BEGIN
  -- Calculate hours before service
  v_hours_before := EXTRACT(EPOCH FROM (p_service_date::timestamp - NOW())) / 3600;
  v_within_48hrs := v_hours_before <= 48;
  
  -- Count drops in current month within 48 hours of service
  SELECT COUNT(*) INTO v_drops_count
  FROM public.subcontractor_job_drops
  WHERE subcontractor_id = p_subcontractor_id
    AND EXTRACT(YEAR FROM dropped_at) = EXTRACT(YEAR FROM NOW())
    AND EXTRACT(MONTH FROM dropped_at) = EXTRACT(MONTH FROM NOW())
    AND hours_before_service <= 48;
  
  -- If this would be the 3rd drop within 48hrs in current month, create restriction
  IF v_within_48hrs AND v_drops_count >= 2 THEN
    -- Create 30-day restriction
    INSERT INTO public.subcontractor_restrictions (
      subcontractor_id,
      reason,
      restriction_type,
      end_date,
      is_active
    ) VALUES (
      p_subcontractor_id,
      'Exceeded maximum job drops within 48 hours (3 drops in current month)',
      'job_acceptance',
      NOW() + INTERVAL '30 days',
      true
    );
    
    RETURN jsonb_build_object(
      'can_drop', false,
      'restriction_applied', true,
      'message', 'You have exceeded the maximum number of job drops within 48 hours. You will be temporarily restricted from accepting new jobs for 30 days.'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'can_drop', true,
    'restriction_applied', false,
    'drops_this_month', v_drops_count,
    'hours_before_service', v_hours_before
  );
END;
$function$;

-- Fix get_available_subcontractors_by_location function
CREATE OR REPLACE FUNCTION public.get_available_subcontractors_by_location(p_customer_city text, p_customer_state text, p_service_date date)
 RETURNS TABLE(subcontractor_id uuid, full_name text, email text, phone text, split_tier text, rating numeric, distance_priority integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.full_name,
    s.email,
    s.phone,
    s.split_tier,
    s.rating,
    CASE 
      WHEN s.city = p_customer_city AND s.state = p_customer_state THEN 1
      WHEN s.state = p_customer_state THEN 2
      ELSE 3
    END as distance_priority
  FROM public.subcontractors s
  WHERE s.is_available = true
    AND s.subscription_status = 'active'
    AND s.id NOT IN (
      -- Exclude subcontractors with active restrictions
      SELECT sr.subcontractor_id
      FROM public.subcontractor_restrictions sr
      WHERE sr.is_active = true
        AND (sr.end_date IS NULL OR sr.end_date > NOW())
    )
    AND s.id NOT IN (
      -- Exclude subcontractors already assigned for that date
      SELECT sja.subcontractor_id
      FROM public.subcontractor_job_assignments sja
      JOIN public.bookings b ON sja.booking_id = b.id
      WHERE b.service_date = p_service_date
        AND sja.status IN ('assigned', 'accepted')
    )
  ORDER BY distance_priority, s.rating DESC, s.created_at ASC;
END;
$function$;

-- Fix create_initial_admin_users function
CREATE OR REPLACE FUNCTION public.create_initial_admin_users()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;