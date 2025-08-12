-- Drop the overly permissive public read policy on orders
DROP POLICY IF EXISTS "Public read access for order lookup" ON public.orders;

-- Create secure RLS policies for orders table
-- Customers can only view their own orders
CREATE POLICY "Customers can view their own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR auth.email() = customer_email);

-- Allow public order lookup by order ID only (for order status checking)
-- This creates a more limited public access for order status functionality
CREATE POLICY "Public order status lookup by ID"
ON public.orders
FOR SELECT
TO anon, authenticated
USING (true);

-- Create a security definer function for safe order lookup
CREATE OR REPLACE FUNCTION public.get_order_status_safe(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order_status jsonb;
BEGIN
  -- Only return limited, non-sensitive order information
  SELECT jsonb_build_object(
    'id', id,
    'status', status,
    'created_at', created_at,
    'scheduled_date', scheduled_date,
    'amount', amount,
    'service_type', service_details->>'service_type'
  ) INTO v_order_status
  FROM public.orders
  WHERE id = p_order_id;
  
  RETURN COALESCE(v_order_status, '{"error": "Order not found"}'::jsonb);
END;
$$;

-- Grant execute permissions for the safe lookup function
GRANT EXECUTE ON FUNCTION public.get_order_status_safe(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_order_status_safe(uuid) TO authenticated;

-- Drop the overly broad public policy and replace with limited access
DROP POLICY IF EXISTS "Public order status lookup by ID" ON public.orders;

-- Create a very limited public policy that only exposes order status via the safe function
-- Actually, let's remove public SELECT entirely and use the function instead
-- No public SELECT policy needed - all access should go through proper authentication or the safe function