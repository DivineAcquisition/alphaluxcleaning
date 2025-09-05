-- Add missing priority column to subcontractor_job_assignments table
ALTER TABLE public.subcontractor_job_assignments 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';

-- Add missing expires_at column if it doesn't exist
ALTER TABLE public.subcontractor_job_assignments 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Add missing response_received_at column if it doesn't exist
ALTER TABLE public.subcontractor_job_assignments 
ADD COLUMN IF NOT EXISTS response_received_at TIMESTAMP WITH TIME ZONE;

-- Add missing assignment_method column for tracking how assignment was made
ALTER TABLE public.subcontractor_job_assignments 
ADD COLUMN IF NOT EXISTS assignment_method TEXT DEFAULT 'manual';

-- Update existing records to have expiration times (24 hours from assigned_at)
UPDATE public.subcontractor_job_assignments 
SET expires_at = assigned_at + INTERVAL '24 hours'
WHERE expires_at IS NULL AND assigned_at IS NOT NULL;