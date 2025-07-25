-- Add new split tier option to the enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'premium';

-- Update the subcontractors table to include the new split tier
ALTER TABLE public.subcontractors DROP CONSTRAINT IF EXISTS subcontractors_split_tier_check;
ALTER TABLE public.subcontractors ADD CONSTRAINT subcontractors_split_tier_check 
CHECK (split_tier IN ('60_40', '50_50', '35_65'));