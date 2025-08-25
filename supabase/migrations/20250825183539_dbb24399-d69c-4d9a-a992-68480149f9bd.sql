-- Create secure email-based customer data access policies

-- Function to validate email format and get customer data safely
CREATE OR REPLACE FUNCTION public.get_customer_data_by_email_safe(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_customer_data jsonb := '{}';
  v_profile_data jsonb;
  v_orders_data jsonb;
  v_bookings_data jsonb;
  v_notifications_data jsonb;
BEGIN
  -- Validate email format
  IF NOT p_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RETURN jsonb_build_object('error', 'Invalid email format');
  END IF;

  -- Get profile data from profiles table (if exists)
  SELECT to_jsonb(p.*) INTO v_profile_data
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.email = p_email;

  -- Get orders data
  SELECT jsonb_agg(to_jsonb(o.*)) INTO v_orders_data
  FROM orders o
  WHERE o.customer_email = p_email;

  -- Get bookings data
  SELECT jsonb_agg(to_jsonb(b.*)) INTO v_bookings_data
  FROM bookings b
  WHERE b.customer_email = p_email;

  -- Get notifications data
  SELECT jsonb_agg(to_jsonb(cn.*)) INTO v_notifications_data
  FROM customer_notifications cn
  JOIN auth.users u ON u.id = cn.customer_id  
  WHERE u.email = p_email;

  -- Build response
  v_customer_data := jsonb_build_object(
    'profile', COALESCE(v_profile_data, 'null'::jsonb),
    'orders', COALESCE(v_orders_data, '[]'::jsonb),
    'bookings', COALESCE(v_bookings_data, '[]'::jsonb),
    'notifications', COALESCE(v_notifications_data, '[]'::jsonb),
    'email', p_email
  );

  RETURN v_customer_data;
END;
$function$;

-- Create RLS policies for email-based customer access
CREATE POLICY "Email-based customer orders access" 
ON public.orders 
FOR SELECT 
USING (customer_email IS NOT NULL);

CREATE POLICY "Email-based customer bookings access" 
ON public.bookings 
FOR SELECT 
USING (customer_email IS NOT NULL);

-- Update existing policies to allow email-based access
DROP POLICY IF EXISTS "Customers can view their own notifications" ON public.customer_notifications;
CREATE POLICY "Customers can view their own notifications" 
ON public.customer_notifications 
FOR SELECT 
USING (
  customer_id = auth.uid() OR 
  customer_id IN (
    SELECT u.id FROM auth.users u 
    WHERE u.email = (SELECT customer_email FROM orders WHERE id = customer_notifications.order_id LIMIT 1)
  )
);

-- Function to mark notification as read by email
CREATE OR REPLACE FUNCTION public.mark_notification_read_by_email(p_notification_id uuid, p_customer_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_customer_id uuid;
BEGIN
  -- Get customer ID from email
  SELECT u.id INTO v_customer_id
  FROM auth.users u
  WHERE u.email = p_customer_email;

  IF v_customer_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.customer_notifications
  SET is_read = true, read_at = now(), updated_at = now()
  WHERE id = p_notification_id AND customer_id = v_customer_id;
  
  -- Track analytics
  INSERT INTO public.notification_analytics (
    notification_id, customer_id, event_type, delivery_method
  ) VALUES (
    p_notification_id, v_customer_id, 'opened', 'in_app'
  );
  
  RETURN FOUND;
END;
$function$;