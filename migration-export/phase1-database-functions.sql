-- Phase 1A: Database Functions Export for Bay Area Cleaning Pros
-- Security Definer Functions and Database Logic
-- Generated: 2025-01-04

-- ============================================
-- USER ROLE MANAGEMENT FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$function$;

-- ============================================
-- SUBCONTRACTOR ONBOARDING FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.validate_onboarding_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_token_record RECORD;
  v_application_record RECORD;
BEGIN
  -- Find token and check if valid
  SELECT * INTO v_token_record
  FROM public.subcontractor_onboarding_tokens
  WHERE token = p_token
    AND is_active = true
    AND used_at IS NULL
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid, expired, or already used onboarding token'
    );
  END IF;
  
  -- Get application data
  SELECT * INTO v_application_record
  FROM public.subcontractor_applications
  WHERE id = v_token_record.application_id
    AND status = 'approved';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Application not found or not approved'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'application_id', v_application_record.id,
    'application_data', to_jsonb(v_application_record)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.mark_onboarding_token_used(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.subcontractor_onboarding_tokens
  SET used_at = now(),
      is_active = false
  WHERE token = p_token
    AND is_active = true
    AND used_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Token not found or already used'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Token marked as used'
  );
END;
$function$;

-- ============================================
-- CALENDAR AND AVAILABILITY FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.get_available_slots(p_subcontractor_id uuid, p_date date, p_time_slots text[])
RETURNS TABLE(time_slot text, available boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  slot TEXT;
  slot_start TIMESTAMP WITH TIME ZONE;
  slot_end TIMESTAMP WITH TIME ZONE;
  is_busy BOOLEAN;
BEGIN
  FOREACH slot IN ARRAY p_time_slots
  LOOP
    -- Parse time slot to get start and end times (assuming 2-hour slots)
    slot_start := (p_date::TEXT || ' ' || slot)::TIMESTAMP WITH TIME ZONE;
    slot_end := slot_start + INTERVAL '2 hours';
    
    -- Check if this slot conflicts with any busy slots
    SELECT EXISTS(
      SELECT 1 FROM public.busy_slots bs
      WHERE bs.subcontractor_id = p_subcontractor_id
        AND bs.start_time < slot_end
        AND bs.end_time > slot_start
    ) INTO is_busy;
    
    RETURN QUERY SELECT slot, NOT is_busy;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.upsert_busy_slot(
  p_calendar_id text, 
  p_start_time timestamp with time zone, 
  p_end_time timestamp with time zone, 
  p_event_title text DEFAULT NULL::text, 
  p_event_id text DEFAULT NULL::text, 
  p_calendar_type text DEFAULT 'business'::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_subcontractor_id UUID;
  v_result JSONB;
BEGIN
  -- For subcontractor calendars, find subcontractor by calendar_id
  IF p_calendar_type = 'subcontractor' THEN
    SELECT id INTO v_subcontractor_id 
    FROM public.subcontractors 
    WHERE calendar_id = p_calendar_id;
    
    IF v_subcontractor_id IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'No subcontractor found with calendar_id: ' || p_calendar_id
      );
    END IF;
  END IF;
  
  -- Upsert busy slot
  INSERT INTO public.busy_slots (
    subcontractor_id,
    calendar_id,
    start_time,
    end_time,
    event_title,
    event_id,
    calendar_type
  ) VALUES (
    v_subcontractor_id,
    p_calendar_id,
    p_start_time,
    p_end_time,
    p_event_title,
    p_event_id,
    p_calendar_type
  )
  ON CONFLICT (calendar_id, start_time, end_time) 
  DO UPDATE SET
    event_title = EXCLUDED.event_title,
    event_id = EXCLUDED.event_id,
    calendar_type = EXCLUDED.calendar_type,
    updated_at = now();
  
  RETURN jsonb_build_object(
    'success', true,
    'subcontractor_id', v_subcontractor_id,
    'calendar_type', p_calendar_type,
    'message', 'Busy slot synced successfully'
  );
END;
$function$;

-- ============================================
-- CALENDAR TOKEN MANAGEMENT
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_calendar_token(p_user_id uuid, p_provider text)
RETURNS jsonb[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb[];
BEGIN
  SELECT array_agg(to_jsonb(uct.*))
  INTO result
  FROM public.user_calendar_tokens uct
  WHERE uct.user_id = p_user_id
    AND uct.provider = p_provider
    AND uct.is_active = true;
  
  RETURN COALESCE(result, ARRAY[]::jsonb[]);
END;
$function$;

CREATE OR REPLACE FUNCTION public.disconnect_calendar_token(p_token_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.user_calendar_tokens
  SET is_active = false,
      updated_at = now()
  WHERE id = p_token_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Token not found'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Calendar token disconnected successfully'
  );
END;
$function$;

-- ============================================
-- REFERRAL SYSTEM FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.validate_and_use_referral_code(
  p_code text, 
  p_user_email text, 
  p_user_name text DEFAULT NULL::text, 
  p_order_id uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_referral_code RECORD;
  v_existing_use RECORD;
  v_result JSONB;
BEGIN
  -- Check if referral code exists and is active
  SELECT * INTO v_referral_code 
  FROM public.referral_codes 
  WHERE code = p_code AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or inactive referral code'
    );
  END IF;
  
  -- Check if code has expired
  IF v_referral_code.expires_at IS NOT NULL AND v_referral_code.expires_at < now() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Referral code has expired'
    );
  END IF;
  
  -- Check if user is trying to use their own referral code
  IF v_referral_code.owner_email = p_user_email THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You cannot use your own referral code'
    );
  END IF;
  
  -- Check if user has already used this referral code
  SELECT * INTO v_existing_use 
  FROM public.referral_uses 
  WHERE referral_code_id = v_referral_code.id AND used_by_email = p_user_email;
  
  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You have already used this referral code'
    );
  END IF;
  
  -- Check if referral code has reached max uses
  IF v_referral_code.max_uses IS NOT NULL AND v_referral_code.current_uses >= v_referral_code.max_uses THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Referral code has reached its usage limit'
    );
  END IF;
  
  -- Record the referral use
  INSERT INTO public.referral_uses (
    referral_code_id,
    used_by_email,
    used_by_name,
    order_id
  ) VALUES (
    v_referral_code.id,
    p_user_email,
    p_user_name,
    p_order_id
  );
  
  -- Update usage count
  UPDATE public.referral_codes 
  SET current_uses = current_uses + 1 
  WHERE id = v_referral_code.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'reward_type', v_referral_code.reward_type,
    'owner_name', v_referral_code.owner_name,
    'message', 'Referral code applied successfully!'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_referral_code(
  p_owner_email text, 
  p_owner_name text DEFAULT NULL::text, 
  p_custom_code text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_code TEXT;
  v_result JSONB;
BEGIN
  -- Generate code if not provided
  IF p_custom_code IS NULL THEN
    v_code := 'REF' || upper(substring(md5(random()::text || p_owner_email), 1, 8));
  ELSE
    v_code := upper(p_custom_code);
  END IF;
  
  -- Check if code already exists
  IF EXISTS (SELECT 1 FROM public.referral_codes WHERE code = v_code) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Referral code already exists'
    );
  END IF;
  
  -- Insert new referral code
  INSERT INTO public.referral_codes (
    code,
    owner_email,
    owner_name
  ) VALUES (
    v_code,
    p_owner_email,
    p_owner_name
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'code', v_code,
    'message', 'Referral code created successfully!'
  );
END;
$function$;

-- ============================================
-- JOB MANAGEMENT FUNCTIONS
-- ============================================

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

CREATE OR REPLACE FUNCTION public.get_available_subcontractors_by_location(
  p_customer_city text, 
  p_customer_state text, 
  p_service_date date
)
RETURNS TABLE(
  subcontractor_id uuid, 
  full_name text, 
  email text, 
  phone text, 
  split_tier text, 
  rating numeric, 
  distance_priority integer
)
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

-- ============================================
-- AUTHENTICATION TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
    
    -- Assign default customer role unless specified otherwise
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'customer'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN NEW;
END;
$function$;

-- Create trigger for automatic user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- ADMIN UTILITIES
-- ============================================

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

-- ============================================
-- END OF FUNCTIONS EXPORT
-- ============================================