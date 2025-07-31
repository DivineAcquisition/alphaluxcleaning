-- Add columns for full account number and full SSN to subcontractor_profiles
ALTER TABLE public.subcontractor_profiles 
ADD COLUMN IF NOT EXISTS account_number text,
ADD COLUMN IF NOT EXISTS ssn text;

-- Update the table comment to reflect the new fields
COMMENT ON COLUMN public.subcontractor_profiles.account_number IS 'Full bank account number (encrypted/secure storage recommended)';
COMMENT ON COLUMN public.subcontractor_profiles.ssn IS 'Full Social Security Number (encrypted/secure storage recommended)';

-- Keep the existing last_four columns for compatibility if needed
COMMENT ON COLUMN public.subcontractor_profiles.account_number_last_four IS 'Last 4 digits of account number (legacy)';
COMMENT ON COLUMN public.subcontractor_profiles.ssn_last_four IS 'Last 4 digits of SSN (legacy)';