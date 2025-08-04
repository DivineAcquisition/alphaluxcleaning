-- Create customer service requests table for tracking modification requests
CREATE TABLE IF NOT EXISTS public.customer_service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('reschedule', 'address_change', 'contact_update', 'cancellation', 'general')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  request_data JSONB NOT NULL DEFAULT '{}',
  customer_notes TEXT,
  admin_notes TEXT,
  requested_by_email TEXT NOT NULL,
  requested_by_name TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on customer service requests
ALTER TABLE public.customer_service_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for customer service requests
CREATE POLICY "Users can create their own service requests" 
ON public.customer_service_requests 
FOR INSERT 
WITH CHECK (
  order_id IN (
    SELECT id FROM public.orders 
    WHERE customer_email = requested_by_email
  )
);

CREATE POLICY "Users can view their own service requests" 
ON public.customer_service_requests 
FOR SELECT 
USING (
  order_id IN (
    SELECT id FROM public.orders 
    WHERE customer_email = requested_by_email
  ) OR
  auth.uid() = reviewed_by
);

CREATE POLICY "Admins can manage all service requests" 
ON public.customer_service_requests 
FOR ALL 
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Create trigger for updated_at column
CREATE TRIGGER update_customer_service_requests_updated_at
  BEFORE UPDATE ON public.customer_service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle service request notifications
CREATE OR REPLACE FUNCTION public.notify_service_request_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert notification for status changes
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO public.order_status_updates (
      order_id,
      status_message,
      created_at
    ) VALUES (
      NEW.order_id,
      'Service request ' || NEW.request_type || ' has been ' || NEW.status,
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for service request notifications
CREATE TRIGGER notify_service_request_update_trigger
  AFTER UPDATE ON public.customer_service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_service_request_update();

-- Create index for performance
CREATE INDEX idx_customer_service_requests_order_id ON public.customer_service_requests(order_id);
CREATE INDEX idx_customer_service_requests_status ON public.customer_service_requests(status);
CREATE INDEX idx_customer_service_requests_type ON public.customer_service_requests(request_type);