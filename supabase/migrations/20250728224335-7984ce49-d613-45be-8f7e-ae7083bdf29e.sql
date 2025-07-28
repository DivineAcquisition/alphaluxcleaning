-- Allow public access to orders for status lookup by session ID or email
CREATE POLICY "public_order_lookup" ON public.orders
  FOR SELECT
  USING (true);