-- Fix generate_referral_code function to properly use pgcrypto extension
CREATE OR REPLACE FUNCTION public.generate_referral_code(customer_email text, customer_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    referral_seed constant text := '971347';
    base_hash text;
    code_candidate text;
    collision_count int := 0;
BEGIN
    -- Create hash from email + seed + customer_id using pgcrypto extension
    base_hash := encode(
        extensions.digest(customer_email || referral_seed || customer_id::text, 'sha256'), 
        'hex'
    );
    
    -- Convert first 8 characters to uppercase
    code_candidate := upper(substring(base_hash, 1, 8));
    
    -- Check for collisions and append checksum if needed
    WHILE EXISTS (SELECT 1 FROM customers WHERE referral_code = code_candidate) LOOP
        collision_count := collision_count + 1;
        code_candidate := upper(substring(base_hash, 1, 7)) || collision_count::text;
    END LOOP;
    
    RETURN code_candidate;
END;
$function$;