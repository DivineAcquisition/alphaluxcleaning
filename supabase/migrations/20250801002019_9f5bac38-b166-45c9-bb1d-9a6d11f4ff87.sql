-- Create database functions for calendar token management
CREATE OR REPLACE FUNCTION public.get_user_calendar_token(p_user_id uuid, p_provider text)
RETURNS jsonb[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb[];
BEGIN
  SELECT array_agg(to_jsonb(uct.*))
  INTO result
  FROM public.user_calendar_tokens uct
  WHERE uct.user_id = p_user_id
    AND uct.provider = p_provider
    AND uct.is_active = true;
  
  RETURN COALESCE(result, ARRAY[]::jsonb[]);
END;
$function$;

-- Create function to disconnect calendar token
CREATE OR REPLACE FUNCTION public.disconnect_calendar_token(p_token_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.user_calendar_tokens
  SET is_active = false,
      updated_at = now()
  WHERE id = p_token_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Token not found'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Calendar token disconnected successfully'
  );
END;
$function$;