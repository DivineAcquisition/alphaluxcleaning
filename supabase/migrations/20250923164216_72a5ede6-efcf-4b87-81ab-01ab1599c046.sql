-- Add referral functions and new tables

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code(customer_email text, customer_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    referral_seed constant text := '971347';
    base_hash text;
    code_candidate text;
    collision_count int := 0;
BEGIN
    -- Create hash from email + seed + customer_id
    base_hash := encode(
        digest(customer_email || referral_seed || customer_id::text, 'sha256'), 
        'hex'
    );
    
    -- Convert first 8 characters to base36 and uppercase
    code_candidate := upper(substring(base_hash, 1, 8));
    
    -- Check for collisions and append checksum if needed
    WHILE EXISTS (SELECT 1 FROM customers WHERE referral_code = code_candidate) LOOP
        collision_count := collision_count + 1;
        code_candidate := upper(substring(base_hash, 1, 7)) || collision_count::text;
    END LOOP;
    
    RETURN code_candidate;
END;
$$;

-- Function to issue referral code to customer
CREATE OR REPLACE FUNCTION issue_referral_code(input_customer_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    customer_record customers%ROWTYPE;
    new_code text;
    app_url constant text := 'https://app.alphaluxclean.com';
BEGIN
    -- Get customer details
    SELECT * INTO customer_record FROM customers WHERE id = input_customer_id;
    
    IF customer_record.id IS NULL THEN
        RAISE EXCEPTION 'Customer not found';
    END IF;
    
    -- Return existing code if already exists
    IF customer_record.referral_code IS NOT NULL THEN
        RETURN customer_record.referral_code;
    END IF;
    
    -- Generate new code
    new_code := generate_referral_code(customer_record.email, customer_record.id);
    
    -- Update customer with code and link
    UPDATE customers 
    SET 
        referral_code = new_code,
        referral_link = app_url || '/ref/' || new_code
    WHERE id = input_customer_id;
    
    RETURN new_code;
END;
$$;