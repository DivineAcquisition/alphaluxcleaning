-- Create recurring_services table
CREATE TABLE public.recurring_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) NOT NULL,
  booking_id UUID REFERENCES public.bookings(id),
  service_type TEXT NOT NULL,
  frequency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  next_service_date DATE,
  service_address JSONB,
  price_per_service NUMERIC NOT NULL,
  discount_percentage NUMERIC DEFAULT 0,
  stripe_subscription_id TEXT,
  pause_start_date DATE,
  pause_end_date DATE,
  cancellation_date TIMESTAMPTZ,
  cancellation_reason TEXT,
  total_services_completed INT DEFAULT 0,
  total_amount_saved NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for recurring_services
CREATE INDEX idx_recurring_services_customer ON public.recurring_services(customer_id);
CREATE INDEX idx_recurring_services_status ON public.recurring_services(status);
CREATE INDEX idx_recurring_services_next_date ON public.recurring_services(next_service_date);

-- Add fields to bookings table
ALTER TABLE public.bookings 
ADD COLUMN parent_recurring_service_id UUID REFERENCES public.recurring_services(id),
ADD COLUMN is_recurring_instance BOOLEAN DEFAULT false;

-- Create index for recurring booking lookups
CREATE INDEX idx_bookings_recurring_service ON public.bookings(parent_recurring_service_id);

-- Enable RLS on recurring_services
ALTER TABLE public.recurring_services ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Customers can view their own recurring services
CREATE POLICY "Customers view own recurring services"
ON public.recurring_services FOR SELECT
USING (customer_id IN (
  SELECT id FROM public.customers WHERE user_id = auth.uid()
));

-- RLS Policy: Service role can manage all recurring services
CREATE POLICY "Service role full access recurring services"
ON public.recurring_services FOR ALL
USING (auth.role() = 'service_role');

-- Create trigger to update updated_at
CREATE TRIGGER update_recurring_services_updated_at
BEFORE UPDATE ON public.recurring_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();