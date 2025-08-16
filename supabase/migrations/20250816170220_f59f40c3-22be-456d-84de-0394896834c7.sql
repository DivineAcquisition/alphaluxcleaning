-- Update webhook sender to use pg_http_post (align with existing pattern)
CREATE OR REPLACE FUNCTION public.send_subcontractor_update_webhook(
  p_update_type text,
  p_subcontractor_id uuid DEFAULT NULL,
  p_assignment_id uuid DEFAULT NULL,
  p_order_id uuid DEFAULT NULL,
  p_location jsonb DEFAULT NULL,
  p_message text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_estimated_arrival_minutes integer DEFAULT NULL,
  p_photos jsonb DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Call the edge function to send webhook
  PERFORM pg_http_post(
    'https://kqoezqzogleaaupjzxch.supabase.co/functions/v1/send-subcontractor-updates',
    jsonb_build_object(
      'update_type', p_update_type,
      'subcontractor_id', p_subcontractor_id,
      'assignment_id', p_assignment_id,
      'order_id', p_order_id,
      'location', p_location,
      'message', p_message,
      'status', p_status,
      'estimated_arrival_minutes', p_estimated_arrival_minutes,
      'photos', p_photos,
      'notes', p_notes
    )::text,
    'application/json'
  );
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the main operation
  NULL;
END;
$$;