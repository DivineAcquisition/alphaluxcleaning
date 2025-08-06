-- Add new columns to subcontractors table for tier system
ALTER TABLE public.subcontractors 
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_jobs_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC DEFAULT 16.00,
ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC DEFAULT 25.00,
ADD COLUMN IF NOT EXISTS tier_level INTEGER DEFAULT 1;

-- Create function to calculate tier based on reviews and completed jobs
CREATE OR REPLACE FUNCTION public.calculate_subcontractor_tier(p_review_count INTEGER, p_completed_jobs INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Tier 3: 25+ reviews & 30+ completed jobs
  IF p_review_count >= 25 AND p_completed_jobs >= 30 THEN
    RETURN 3;
  -- Tier 2: 15+ reviews & 20+ completed jobs  
  ELSIF p_review_count >= 15 AND p_completed_jobs >= 20 THEN
    RETURN 2;
  -- Tier 1: Default
  ELSE
    RETURN 1;
  END IF;
END;
$$;

-- Create function to get tier benefits (hourly rate and monthly fee)
CREATE OR REPLACE FUNCTION public.get_tier_benefits(p_tier_level INTEGER)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CASE p_tier_level
    WHEN 3 THEN
      RETURN jsonb_build_object(
        'hourly_rate', 21.00,
        'monthly_fee', 65.00,
        'tier_name', 'Elite',
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
$$;

-- Create function to update subcontractor tier
CREATE OR REPLACE FUNCTION public.update_subcontractor_tier(p_subcontractor_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subcontractor RECORD;
  v_new_tier INTEGER;
  v_tier_benefits jsonb;
BEGIN
  -- Get current subcontractor data
  SELECT * INTO v_subcontractor
  FROM public.subcontractors
  WHERE id = p_subcontractor_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Subcontractor not found'
    );
  END IF;
  
  -- Calculate new tier
  v_new_tier := public.calculate_subcontractor_tier(
    v_subcontractor.review_count,
    v_subcontractor.completed_jobs_count
  );
  
  -- Get tier benefits
  v_tier_benefits := public.get_tier_benefits(v_new_tier);
  
  -- Update subcontractor with new tier and rates
  UPDATE public.subcontractors
  SET 
    tier_level = v_new_tier,
    hourly_rate = (v_tier_benefits->>'hourly_rate')::NUMERIC,
    monthly_fee = (v_tier_benefits->>'monthly_fee')::NUMERIC,
    updated_at = now()
  WHERE id = p_subcontractor_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'old_tier', v_subcontractor.tier_level,
    'new_tier', v_new_tier,
    'tier_benefits', v_tier_benefits
  );
END;
$$;

-- Create trigger function to auto-update tier when metrics change
CREATE OR REPLACE FUNCTION public.trigger_update_subcontractor_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only update if review_count or completed_jobs_count changed
  IF (OLD.review_count != NEW.review_count OR OLD.completed_jobs_count != NEW.completed_jobs_count) THEN
    PERFORM public.update_subcontractor_tier(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic tier updates
DROP TRIGGER IF EXISTS update_subcontractor_tier_on_metrics_change ON public.subcontractors;
CREATE TRIGGER update_subcontractor_tier_on_metrics_change
  AFTER UPDATE ON public.subcontractors
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_subcontractor_tier();