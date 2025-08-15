-- Phase 4: Add account status management and restrictions system

-- Add account_status column to subcontractors table
ALTER TABLE public.subcontractors 
ADD COLUMN account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned', 'inactive'));

-- Create subcontractor_restrictions table
CREATE TABLE public.subcontractor_restrictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subcontractor_id UUID REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  restriction_type TEXT NOT NULL DEFAULT 'job_acceptance',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on subcontractor_restrictions
ALTER TABLE public.subcontractor_restrictions ENABLE ROW LEVEL SECURITY;

-- RLS policies for subcontractor_restrictions
CREATE POLICY "Admins can manage restrictions" ON public.subcontractor_restrictions
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Subcontractors can view their own restrictions" ON public.subcontractor_restrictions
  FOR SELECT USING (
    subcontractor_id IN (
      SELECT id FROM public.subcontractors 
      WHERE user_id = auth.uid()
    )
  );

-- Add indexes for performance
CREATE INDEX idx_subcontractor_restrictions_subcontractor_id ON public.subcontractor_restrictions(subcontractor_id);
CREATE INDEX idx_subcontractor_restrictions_active ON public.subcontractor_restrictions(is_active) WHERE is_active = true;
CREATE INDEX idx_subcontractors_account_status ON public.subcontractors(account_status);

-- Create function to automatically update restrictions based on account status
CREATE OR REPLACE FUNCTION public.update_account_status_restrictions()
RETURNS TRIGGER AS $$
BEGIN
  -- If account is suspended, create/update restriction
  IF NEW.account_status = 'suspended' AND OLD.account_status != 'suspended' THEN
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
    );
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

-- Create trigger for account status changes
CREATE TRIGGER trigger_account_status_restrictions
  AFTER UPDATE OF account_status ON public.subcontractors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_account_status_restrictions();

-- Update existing subcontractors to have active status
UPDATE public.subcontractors 
SET account_status = 'active' 
WHERE account_status IS NULL;