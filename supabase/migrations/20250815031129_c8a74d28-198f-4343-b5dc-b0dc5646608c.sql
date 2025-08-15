-- Add a status update to track completed applications
ALTER TABLE subcontractor_applications 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Update existing 'approved' applications that might need completion tracking
UPDATE subcontractor_applications 
SET completed_at = updated_at 
WHERE status = 'completed' AND completed_at IS NULL;