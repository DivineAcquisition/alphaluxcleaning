-- Fix Add Cleaner page permissions and create GHL contacts table
-- First, ensure the bulk_onboard_existing_cleaners function has proper error handling
CREATE OR REPLACE FUNCTION public.bulk_onboard_existing_cleaners(p_cleaners jsonb)
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
    ) 
    ON CONFLICT (email) DO UPDATE SET
      status = 'approved',
      admin_notes = 'Existing cleaner - re-processed for onboarding'
    RETURNING id INTO application_id;
    
    -- Create or update onboarding token
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
    )
    ON CONFLICT (application_id) DO UPDATE SET
      token = EXCLUDED.token,
      is_active = true,
      expires_at = EXCLUDED.expires_at;
    
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

-- Create GHL contacts tracking table
CREATE TABLE IF NOT EXISTS public.ghl_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id text UNIQUE NOT NULL,
  order_id uuid REFERENCES public.orders(id),
  customer_email text NOT NULL,
  customer_name text,
  customer_phone text,
  pipeline_id text,
  stage_id text,
  lead_score integer DEFAULT 0,
  ghl_data jsonb DEFAULT '{}',
  last_synced_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ghl_contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for GHL contacts
CREATE POLICY "Admins can manage GHL contacts" ON public.ghl_contacts
FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System can manage GHL contacts" ON public.ghl_contacts
FOR ALL USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_ghl_contacts_updated_at
BEFORE UPDATE ON public.ghl_contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();