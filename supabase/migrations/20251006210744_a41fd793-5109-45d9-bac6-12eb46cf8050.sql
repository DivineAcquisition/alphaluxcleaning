-- Enhance hcp_sync_log table for better tracking
ALTER TABLE public.hcp_sync_log
ADD COLUMN IF NOT EXISTS error_category TEXT,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS request_payload JSONB,
ADD COLUMN IF NOT EXISTS response_payload JSONB;

-- Add index for retry scheduling
CREATE INDEX IF NOT EXISTS idx_hcp_sync_log_next_retry 
ON public.hcp_sync_log(next_retry_at) 
WHERE status = 'failed' AND retry_count < 5;

-- Add index for error analysis
CREATE INDEX IF NOT EXISTS idx_hcp_sync_log_error_category 
ON public.hcp_sync_log(error_category) 
WHERE error_category IS NOT NULL;