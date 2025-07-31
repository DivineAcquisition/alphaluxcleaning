-- Create onboarding tokens table for secure subcontractor account creation
CREATE TABLE public.subcontractor_onboarding_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  application_id UUID NOT NULL REFERENCES public.subcontractor_applications(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '1 day'),
  used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subcontractor_onboarding_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies (restrictive - only functions can access)
CREATE POLICY "Onboarding tokens are only accessible by functions" 
ON public.subcontractor_onboarding_tokens 
FOR ALL 
USING (false);

-- Create index for token lookups
CREATE INDEX idx_onboarding_tokens_token ON public.subcontractor_onboarding_tokens(token);
CREATE INDEX idx_onboarding_tokens_expires ON public.subcontractor_onboarding_tokens(expires_at);

-- Add trigger for updated_at
CREATE TRIGGER update_onboarding_tokens_updated_at
BEFORE UPDATE ON public.subcontractor_onboarding_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to validate onboarding token
CREATE OR REPLACE FUNCTION public.validate_onboarding_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_token_record RECORD;
  v_application_record RECORD;
BEGIN
  -- Find token and check if valid
  SELECT * INTO v_token_record
  FROM public.subcontractor_onboarding_tokens
  WHERE token = p_token
    AND is_active = true
    AND used_at IS NULL
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid, expired, or already used onboarding token'
    );
  END IF;
  
  -- Get application data
  SELECT * INTO v_application_record
  FROM public.subcontractor_applications
  WHERE id = v_token_record.application_id
    AND status = 'approved';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Application not found or not approved'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'application_id', v_application_record.id,
    'application_data', to_jsonb(v_application_record)
  );
END;
$function$;

-- Function to mark token as used
CREATE OR REPLACE FUNCTION public.mark_onboarding_token_used(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.subcontractor_onboarding_tokens
  SET used_at = now(),
      is_active = false
  WHERE token = p_token
    AND is_active = true
    AND used_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Token not found or already used'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Token marked as used'
  );
END;
$function$;