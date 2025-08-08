-- Update tier system to use hourly rates instead of split tiers
-- Add new tier level 2 as the starting tier for existing cleaners

-- First, update existing tier benefits function to support new hourly structure
CREATE OR REPLACE FUNCTION public.get_tier_benefits(p_tier_level integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  CASE p_tier_level
    WHEN 3 THEN
      RETURN jsonb_build_object(
        'hourly_rate', 21.00,
        'monthly_fee', 65.00,
        'tier_name', 'Premium',
        'requirements', jsonb_build_object('reviews', 25, 'jobs', 30)
      );
    WHEN 2 THEN
      RETURN jsonb_build_object(
        'hourly_rate', 18.00,
        'monthly_fee', 50.00,
        'tier_name', 'Professional',
        'requirements', jsonb_build_object('reviews', 15, 'jobs', 20)
      );
    ELSE
      RETURN jsonb_build_object(
        'hourly_rate', 16.00,
        'monthly_fee', 25.00,
        'tier_name', 'Standard',
        'requirements', jsonb_build_object('reviews', 0, 'jobs', 0)
      );
  END CASE;
END;
$function$;

-- Create function to bulk onboard existing cleaners
CREATE OR REPLACE FUNCTION public.bulk_onboard_existing_cleaners(
  p_cleaners jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  cleaner_record jsonb;
  application_id uuid;
  onboarding_token text;
  result jsonb := '[]'::jsonb;
BEGIN
  -- Loop through each cleaner in the array
  FOR cleaner_record IN SELECT * FROM jsonb_array_elements(p_cleaners)
  LOOP
    -- Generate onboarding token
    onboarding_token := 'EXISTING_' || upper(substring(md5(random()::text || (cleaner_record->>'email')), 1, 12));
    
    -- Create application record with approved status
    INSERT INTO public.subcontractor_applications (
      full_name,
      email,
      phone,
      why_join_us,
      previous_cleaning_experience,
      availability,
      emergency_contact_name,
      emergency_contact_phone,
      has_drivers_license,
      has_own_vehicle,
      can_lift_heavy_items,
      reliable_transportation,
      comfortable_with_chemicals,
      background_check_consent,
      brand_shirt_consent,
      subcontractor_agreement_consent,
      status,
      admin_notes,
      address,
      city,
      state,
      zip_code
    ) VALUES (
      cleaner_record->>'full_name',
      cleaner_record->>'email',
      COALESCE(cleaner_record->>'phone', ''),
      'Existing team member transitioning to new digital platform',
      'Experienced cleaner with Bay Area Cleaning Professionals',
      COALESCE(cleaner_record->>'availability', 'Flexible schedule'),
      COALESCE(cleaner_record->>'emergency_contact_name', 'To be updated'),
      COALESCE(cleaner_record->>'emergency_contact_phone', 'To be updated'),
      true, -- has_drivers_license
      true, -- has_own_vehicle  
      true, -- can_lift_heavy_items
      true, -- reliable_transportation
      true, -- comfortable_with_chemicals
      true, -- background_check_consent
      true, -- brand_shirt_consent
      true, -- subcontractor_agreement_consent
      'approved', -- status
      'Existing cleaner - auto-approved for Tier 2 (Professional) onboarding',
      COALESCE(cleaner_record->>'address', ''),
      COALESCE(cleaner_record->>'city', ''),
      COALESCE(cleaner_record->>'state', 'CA'),
      COALESCE(cleaner_record->>'zip_code', '')
    ) RETURNING id INTO application_id;
    
    -- Create onboarding token
    INSERT INTO public.subcontractor_onboarding_tokens (
      application_id,
      token,
      is_active,
      expires_at
    ) VALUES (
      application_id,
      onboarding_token,
      true,
      now() + interval '30 days'
    );
    
    -- Add to result
    result := result || jsonb_build_object(
      'email', cleaner_record->>'email',
      'full_name', cleaner_record->>'full_name',
      'application_id', application_id,
      'onboarding_token', onboarding_token,
      'status', 'ready_for_onboarding',
      'tier_level', 2,
      'hourly_rate', 18.00,
      'monthly_fee', 50.00
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Bulk onboarding setup completed',
    'cleaners_processed', jsonb_array_length(p_cleaners),
    'results', result
  );
END;
$function$;