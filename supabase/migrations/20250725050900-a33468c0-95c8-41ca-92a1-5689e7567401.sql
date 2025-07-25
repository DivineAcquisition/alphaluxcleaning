-- Create subcontractors table
CREATE TABLE public.subcontractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  split_tier TEXT NOT NULL CHECK (split_tier IN ('60_40', '50_50')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'cancelled')),
  stripe_customer_id TEXT,
  subscription_id TEXT,
  jobs_completed_this_month INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 5.0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create subcontractor job assignments table
CREATE TABLE public.subcontractor_job_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id UUID REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'completed', 'dropped', 'cancelled')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  dropped_at TIMESTAMPTZ,
  drop_reason TEXT,
  customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
  subcontractor_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(booking_id)
);

-- Create subcontractor payments table
CREATE TABLE public.subcontractor_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id UUID REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES public.subcontractor_job_assignments(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  subcontractor_amount DECIMAL(10,2) NOT NULL,
  company_amount DECIMAL(10,2) NOT NULL,
  split_percentage INTEGER NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create subcontractor restrictions table
CREATE TABLE public.subcontractor_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id UUID REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  restriction_type TEXT NOT NULL DEFAULT 'job_acceptance' CHECK (restriction_type IN ('job_acceptance', 'full_suspension')),
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create subcontractor job drops tracking table
CREATE TABLE public.subcontractor_job_drops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id UUID REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES public.subcontractor_job_assignments(id) ON DELETE CASCADE,
  dropped_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  service_date DATE NOT NULL,
  hours_before_service INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractor_job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractor_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractor_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractor_job_drops ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subcontractors
CREATE POLICY "Subcontractors can view their own profile" ON public.subcontractors
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Subcontractors can update their own profile" ON public.subcontractors
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can insert subcontractors" ON public.subcontractors
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all subcontractors" ON public.subcontractors
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role));

-- Create RLS policies for job assignments
CREATE POLICY "Subcontractors can view their own assignments" ON public.subcontractor_job_assignments
FOR SELECT USING (
  subcontractor_id IN (
    SELECT id FROM public.subcontractors WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Subcontractors can update their own assignments" ON public.subcontractor_job_assignments
FOR UPDATE USING (
  subcontractor_id IN (
    SELECT id FROM public.subcontractors WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can manage job assignments" ON public.subcontractor_job_assignments
FOR ALL USING (true);

CREATE POLICY "Admins can view all assignments" ON public.subcontractor_job_assignments
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role));

-- Create RLS policies for payments
CREATE POLICY "Subcontractors can view their own payments" ON public.subcontractor_payments
FOR SELECT USING (
  subcontractor_id IN (
    SELECT id FROM public.subcontractors WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can manage payments" ON public.subcontractor_payments
FOR ALL USING (true);

CREATE POLICY "Admins can view all payments" ON public.subcontractor_payments
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role));

-- Create RLS policies for restrictions
CREATE POLICY "Subcontractors can view their own restrictions" ON public.subcontractor_restrictions
FOR SELECT USING (
  subcontractor_id IN (
    SELECT id FROM public.subcontractors WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can manage restrictions" ON public.subcontractor_restrictions
FOR ALL USING (true);

CREATE POLICY "Admins can manage all restrictions" ON public.subcontractor_restrictions
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role));

-- Create RLS policies for job drops
CREATE POLICY "Subcontractors can view their own drops" ON public.subcontractor_job_drops
FOR SELECT USING (
  subcontractor_id IN (
    SELECT id FROM public.subcontractors WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can insert job drops" ON public.subcontractor_job_drops
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all drops" ON public.subcontractor_job_drops
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role));

-- Create triggers for updated_at columns
CREATE TRIGGER update_subcontractors_updated_at
BEFORE UPDATE ON public.subcontractors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subcontractor_job_assignments_updated_at
BEFORE UPDATE ON public.subcontractor_job_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subcontractor_payments_updated_at
BEFORE UPDATE ON public.subcontractor_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subcontractor_restrictions_updated_at
BEFORE UPDATE ON public.subcontractor_restrictions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check job drop restrictions
CREATE OR REPLACE FUNCTION public.check_job_drop_restrictions(p_subcontractor_id UUID, p_service_date DATE)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_drops_count INTEGER;
  v_within_48hrs BOOLEAN;
  v_hours_before INTEGER;
BEGIN
  -- Calculate hours before service
  v_hours_before := EXTRACT(EPOCH FROM (p_service_date::timestamp - NOW())) / 3600;
  v_within_48hrs := v_hours_before <= 48;
  
  -- Count drops in current month within 48 hours of service
  SELECT COUNT(*) INTO v_drops_count
  FROM public.subcontractor_job_drops
  WHERE subcontractor_id = p_subcontractor_id
    AND EXTRACT(YEAR FROM dropped_at) = EXTRACT(YEAR FROM NOW())
    AND EXTRACT(MONTH FROM dropped_at) = EXTRACT(MONTH FROM NOW())
    AND hours_before_service <= 48;
  
  -- If this would be the 3rd drop within 48hrs in current month, create restriction
  IF v_within_48hrs AND v_drops_count >= 2 THEN
    -- Create 30-day restriction
    INSERT INTO public.subcontractor_restrictions (
      subcontractor_id,
      reason,
      restriction_type,
      end_date,
      is_active
    ) VALUES (
      p_subcontractor_id,
      'Exceeded maximum job drops within 48 hours (3 drops in current month)',
      'job_acceptance',
      NOW() + INTERVAL '30 days',
      true
    );
    
    RETURN jsonb_build_object(
      'can_drop', false,
      'restriction_applied', true,
      'message', 'You have exceeded the maximum number of job drops within 48 hours. You will be temporarily restricted from accepting new jobs for 30 days.'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'can_drop', true,
    'restriction_applied', false,
    'drops_this_month', v_drops_count,
    'hours_before_service', v_hours_before
  );
END;
$$;

-- Create function to get available subcontractors by location
CREATE OR REPLACE FUNCTION public.get_available_subcontractors_by_location(
  p_customer_city TEXT,
  p_customer_state TEXT,
  p_service_date DATE
)
RETURNS TABLE (
  subcontractor_id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  split_tier TEXT,
  rating DECIMAL,
  distance_priority INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.full_name,
    s.email,
    s.phone,
    s.split_tier,
    s.rating,
    CASE 
      WHEN s.city = p_customer_city AND s.state = p_customer_state THEN 1
      WHEN s.state = p_customer_state THEN 2
      ELSE 3
    END as distance_priority
  FROM public.subcontractors s
  WHERE s.is_available = true
    AND s.subscription_status = 'active'
    AND s.id NOT IN (
      -- Exclude subcontractors with active restrictions
      SELECT sr.subcontractor_id
      FROM public.subcontractor_restrictions sr
      WHERE sr.is_active = true
        AND (sr.end_date IS NULL OR sr.end_date > NOW())
    )
    AND s.id NOT IN (
      -- Exclude subcontractors already assigned for that date
      SELECT sja.subcontractor_id
      FROM public.subcontractor_job_assignments sja
      JOIN public.bookings b ON sja.booking_id = b.id
      WHERE b.service_date = p_service_date
        AND sja.status IN ('assigned', 'accepted')
    )
  ORDER BY distance_priority, s.rating DESC, s.created_at ASC;
END;
$$;