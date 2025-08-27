
-- Patch: make Airtable sync trigger logging safe and provide event_type

CREATE OR REPLACE FUNCTION public.trigger_airtable_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Attempt to call the edge function to sync order to Airtable
  PERFORM pg_http_post(
    'https://kqoezqzogleaaupjzxch.supabase.co/functions/v1/sync-to-airtable',
    jsonb_build_object(
      'action', 'sync_order',
      'data', to_jsonb(NEW)
    )::text,
    'application/json'
  );

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Ensure logging never breaks the main transaction
  BEGIN
    INSERT INTO public.webhook_logs (
      event_type,
      webhook_url,
      payload,
      response_status,
      success,
      error_message
    ) VALUES (
      'airtable_sync',
      'airtable_sync',
      to_jsonb(NEW),
      500,
      false,
      SQLERRM
    );
  EXCEPTION WHEN OTHERS THEN
    -- Swallow any logging errors
    NULL;
  END;

  RETURN NEW;
END;
$function$;
