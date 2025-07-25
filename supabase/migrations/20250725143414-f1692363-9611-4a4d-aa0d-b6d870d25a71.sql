-- Create table for order status updates
CREATE TABLE public.order_status_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  subcontractor_id UUID REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  status_message TEXT NOT NULL,
  estimated_arrival_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for tips
CREATE TABLE public.order_tips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  subcontractor_id UUID REFERENCES public.subcontractors(id),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  customer_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_status_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tips ENABLE ROW LEVEL SECURITY;

-- Create policies for order_status_updates
CREATE POLICY "Subcontractors can insert their own status updates"
ON public.order_status_updates
FOR INSERT
WITH CHECK (
  subcontractor_id IN (
    SELECT id FROM public.subcontractors
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view status updates for their orders"
ON public.order_status_updates
FOR SELECT
USING (true);

CREATE POLICY "Subcontractors can update their own status updates"
ON public.order_status_updates
FOR UPDATE
USING (
  subcontractor_id IN (
    SELECT id FROM public.subcontractors
    WHERE user_id = auth.uid()
  )
);

-- Create policies for order_tips
CREATE POLICY "Anyone can insert tips"
ON public.order_tips
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Subcontractors can view their own tips"
ON public.order_tips
FOR SELECT
USING (
  subcontractor_id IN (
    SELECT id FROM public.subcontractors
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all tips"
ON public.order_tips
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_order_status_updates_updated_at
BEFORE UPDATE ON public.order_status_updates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_order_status_updates_order_id ON public.order_status_updates(order_id);
CREATE INDEX idx_order_status_updates_subcontractor_id ON public.order_status_updates(subcontractor_id);
CREATE INDEX idx_order_tips_order_id ON public.order_tips(order_id);
CREATE INDEX idx_order_tips_subcontractor_id ON public.order_tips(subcontractor_id);