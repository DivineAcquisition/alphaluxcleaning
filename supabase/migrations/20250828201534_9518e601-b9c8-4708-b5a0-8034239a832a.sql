-- Update tier system configuration with new 4-tier structure and updated rates
UPDATE public.tier_system_config 
SET 
  hourly_rate = CASE 
    WHEN tier_level = 1 THEN 14.00
    WHEN tier_level = 2 THEN 16.00  
    WHEN tier_level = 3 THEN 18.00
  END,
  monthly_fee = CASE
    WHEN tier_level = 1 THEN 25.00
    WHEN tier_level = 2 THEN 40.00
    WHEN tier_level = 3 THEN 55.00
  END,
  requirements = CASE
    WHEN tier_level = 1 THEN jsonb_build_object('reviews', 0, 'jobs', 0)
    WHEN tier_level = 2 THEN jsonb_build_object('reviews', 10, 'jobs', 15)
    WHEN tier_level = 3 THEN jsonb_build_object('reviews', 20, 'jobs', 25)
  END
WHERE tier_level IN (1, 2, 3);

-- Insert new Tier 4
INSERT INTO public.tier_system_config (
  tier_level,
  tier_name, 
  hourly_rate,
  monthly_fee,
  requirements,
  is_active
) VALUES (
  4,
  'Premium',
  20.00,
  70.00,
  jsonb_build_object('reviews', 30, 'jobs', 40),
  true
) ON CONFLICT (tier_level) DO UPDATE SET
  tier_name = EXCLUDED.tier_name,
  hourly_rate = EXCLUDED.hourly_rate,
  monthly_fee = EXCLUDED.monthly_fee,
  requirements = EXCLUDED.requirements,
  is_active = EXCLUDED.is_active;

-- Update the get_tier_benefits function to support 4 tiers
CREATE OR REPLACE FUNCTION public.get_tier_benefits(p_tier_level integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  CASE p_tier_level
    WHEN 4 THEN
      RETURN jsonb_build_object(
        'hourly_rate', 20.00,
        'monthly_fee', 70.00,
        'tier_name', 'Premium',
        'requirements', jsonb_build_object('reviews', 30, 'jobs', 40)
      );
    WHEN 3 THEN
      RETURN jsonb_build_object(
        'hourly_rate', 18.00,
        'monthly_fee', 55.00,
        'tier_name', 'Elite',
        'requirements', jsonb_build_object('reviews', 20, 'jobs', 25)
      );
    WHEN 2 THEN
      RETURN jsonb_build_object(
        'hourly_rate', 16.00,
        'monthly_fee', 40.00,
        'tier_name', 'Professional',
        'requirements', jsonb_build_object('reviews', 10, 'jobs', 15)
      );
    ELSE
      RETURN jsonb_build_object(
        'hourly_rate', 14.00,
        'monthly_fee', 25.00,
        'tier_name', 'Standard',
        'requirements', jsonb_build_object('reviews', 0, 'jobs', 0)
      );
  END CASE;
END;
$function$;

-- Update the calculate_subcontractor_tier function to support 4 tiers  
CREATE OR REPLACE FUNCTION public.calculate_subcontractor_tier(p_review_count integer, p_completed_jobs integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Tier 4: 30+ reviews & 40+ completed jobs
  IF p_review_count >= 30 AND p_completed_jobs >= 40 THEN
    RETURN 4;
  -- Tier 3: 20+ reviews & 25+ completed jobs  
  ELSIF p_review_count >= 20 AND p_completed_jobs >= 25 THEN
    RETURN 3;
  -- Tier 2: 10+ reviews & 15+ completed jobs
  ELSIF p_review_count >= 10 AND p_completed_jobs >= 15 THEN
    RETURN 2;
  -- Tier 1: Default
  ELSE
    RETURN 1;
  END IF;
END;
$function$;