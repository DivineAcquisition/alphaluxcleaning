-- Create a function to automatically create customer accounts when they book services
CREATE OR REPLACE FUNCTION public.create_customer_account_on_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_password text;
  v_signup_result jsonb;
BEGIN
  -- Check if user already exists
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = NEW.customer_email;
  
  -- If user doesn't exist, create account
  IF v_user_id IS NULL THEN
    -- Generate a temporary password
    v_password := 'BayArea' || substr(md5(random()::text), 1, 8) || '!';
    
    -- Create the user account via auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_sent_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      NEW.customer_email,
      crypt(v_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      jsonb_build_object('full_name', NEW.customer_name, 'phone', NEW.customer_phone)
    ) RETURNING id INTO v_user_id;
    
    -- Create profile record
    INSERT INTO public.profiles (
      id,
      full_name,
      phone,
      customer_since
    ) VALUES (
      v_user_id,
      NEW.customer_name,
      NEW.customer_phone,
      now()
    );
    
    -- Store temp password for welcome email (you could also queue a notification)
    INSERT INTO public.customer_notifications (
      customer_id,
      title,
      message,
      notification_type,
      order_id,
      importance
    ) VALUES (
      v_user_id,
      'Welcome to Bay Area Cleaning Pros!',
      'Your account has been created. Your temporary password is: ' || v_password || '. Please log in to your customer portal and change your password.',
      'account_created',
      NEW.id,
      'high'
    );
  END IF;
  
  -- Update the order with the user_id if not already set
  IF NEW.user_id IS NULL THEN
    NEW.user_id = v_user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create customer accounts on order creation
DROP TRIGGER IF EXISTS trigger_create_customer_account ON public.orders;
CREATE TRIGGER trigger_create_customer_account
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_customer_account_on_booking();