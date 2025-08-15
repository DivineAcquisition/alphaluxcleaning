-- Phase 4: Add account status management (partial - add missing column only)

-- Add account_status column to subcontractors table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'subcontractors' 
                 AND column_name = 'account_status') THEN
    ALTER TABLE public.subcontractors 
    ADD COLUMN account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned', 'inactive'));
  END IF;
END $$;

-- Add indexes for performance if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_subcontractors_account_status') THEN
    CREATE INDEX idx_subcontractors_account_status ON public.subcontractors(account_status);
  END IF;
END $$;

-- Create function to automatically update restrictions based on account status
CREATE OR REPLACE FUNCTION public.update_account_status_restrictions()
RETURNS TRIGGER AS $$
BEGIN
  -- If account is suspended, create/update restriction
  IF NEW.account_status = 'suspended' AND (OLD.account_status IS NULL OR OLD.account_status != 'suspended') THEN
    INSERT INTO public.subcontractor_restrictions (
      subcontractor_id,
      reason,
      restriction_type,
      is_active
    ) VALUES (
      NEW.id,
      'Account suspended - automated restriction',
      'job_acceptance',
      true
    )
    ON CONFLICT (subcontractor_id) 
    DO UPDATE SET 
      is_active = true,
      updated_at = now();
  END IF;
  
  -- If account is reactivated, deactivate restrictions
  IF NEW.account_status = 'active' AND OLD.account_status IN ('suspended', 'banned') THEN
    UPDATE public.subcontractor_restrictions
    SET is_active = false, updated_at = now()
    WHERE subcontractor_id = NEW.id AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS trigger_account_status_restrictions ON public.subcontractors;
CREATE TRIGGER trigger_account_status_restrictions
  AFTER UPDATE OF account_status ON public.subcontractors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_account_status_restrictions();

-- Update existing subcontractors to have active status where null
UPDATE public.subcontractors 
SET account_status = 'active' 
WHERE account_status IS NULL;