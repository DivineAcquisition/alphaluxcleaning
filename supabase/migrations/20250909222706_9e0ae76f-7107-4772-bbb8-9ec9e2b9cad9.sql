-- Add missing columns to bookings table for earnings tracking
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS gratuity_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN IF NOT EXISTS rating_note TEXT,
ADD COLUMN IF NOT EXISTS payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'paid', 'on_hold')),
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Create payout_batches table
CREATE TABLE IF NOT EXISTS public.payout_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'processing', 'paid', 'failed')),
  total_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create payout_batch_items table
CREATE TABLE IF NOT EXISTS public.payout_batch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_batch_id UUID NOT NULL REFERENCES public.payout_batches(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  subcontractor_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create subcontractor_adjustments table
CREATE TABLE IF NOT EXISTS public.subcontractor_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  subcontractor_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create subcontractor_notifications table
CREATE TABLE IF NOT EXISTS public.subcontractor_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  subcontractor_id UUID NOT NULL,
  user_id UUID,
  type TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_subcontractor_completed ON public.bookings(subcontractor_payout_amount, completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_payout_status ON public.bookings(payout_status, completed_at);
CREATE INDEX IF NOT EXISTS idx_payout_batch_items_batch_id ON public.payout_batch_items(payout_batch_id);
CREATE INDEX IF NOT EXISTS idx_payout_batch_items_subcontractor ON public.payout_batch_items(subcontractor_id, paid_at);
CREATE INDEX IF NOT EXISTS idx_subcontractor_adjustments_subcontractor ON public.subcontractor_adjustments(subcontractor_id, applied_at);
CREATE INDEX IF NOT EXISTS idx_subcontractor_notifications_subcontractor ON public.subcontractor_notifications(subcontractor_id, read, created_at);

-- Add RLS policies for payout_batches
ALTER TABLE public.payout_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payout batches" ON public.payout_batches
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager') 
    AND company_id = payout_batches.company_id
  )
);

-- Add RLS policies for payout_batch_items
ALTER TABLE public.payout_batch_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subcontractors can view their payout items" ON public.payout_batch_items
FOR SELECT USING (
  subcontractor_id IN (
    SELECT id FROM public.subcontractors 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage payout items" ON public.payout_batch_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.payout_batches pb
    JOIN public.user_roles ur ON ur.company_id = pb.company_id
    WHERE pb.id = payout_batch_items.payout_batch_id
    AND ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'manager')
  )
);

-- Add RLS policies for subcontractor_adjustments
ALTER TABLE public.subcontractor_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subcontractors can view their adjustments" ON public.subcontractor_adjustments
FOR SELECT USING (
  subcontractor_id IN (
    SELECT id FROM public.subcontractors 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage adjustments" ON public.subcontractor_adjustments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager') 
    AND company_id = subcontractor_adjustments.company_id
  )
);

-- Add RLS policies for subcontractor_notifications
ALTER TABLE public.subcontractor_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subcontractors can manage their notifications" ON public.subcontractor_notifications
FOR ALL USING (
  subcontractor_id IN (
    SELECT id FROM public.subcontractors 
    WHERE user_id = auth.uid()
  )
);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payout_batches_updated_at
  BEFORE UPDATE ON public.payout_batches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_payout_batch_items_updated_at
  BEFORE UPDATE ON public.payout_batch_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_subcontractor_notifications_updated_at
  BEFORE UPDATE ON public.subcontractor_notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();