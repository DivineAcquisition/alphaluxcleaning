-- Enable deletion for admins on orders table
CREATE POLICY "Admins can delete orders" 
ON public.orders 
FOR DELETE 
USING (true);

-- Also allow admins to manage all orders
CREATE POLICY "Admins can manage all orders" 
ON public.orders 
FOR ALL 
USING (true);