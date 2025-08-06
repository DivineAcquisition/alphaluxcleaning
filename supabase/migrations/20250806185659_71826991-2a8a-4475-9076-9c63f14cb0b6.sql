-- Create tier change history tracking table
CREATE TABLE public.tier_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id UUID REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  old_tier INTEGER,
  new_tier INTEGER,
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  automatic BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on tier change history
ALTER TABLE public.tier_change_history ENABLE ROW LEVEL SECURITY;

-- Create policies for tier change history
CREATE POLICY "Admins can manage tier change history" 
ON public.tier_change_history 
FOR ALL 
USING (true);

CREATE POLICY "Subcontractors can view their tier change history" 
ON public.tier_change_history 
FOR SELECT 
USING (subcontractor_id IN (
  SELECT id FROM public.subcontractors 
  WHERE user_id = auth.uid()
));

-- Create enhanced payment tracking table
CREATE TABLE public.subcontractor_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id UUID REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  payment_amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  tier_level INTEGER NOT NULL,
  monthly_fee NUMERIC NOT NULL,
  hourly_rate NUMERIC NOT NULL,
  payment_method TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on subcontractor payments
ALTER TABLE public.subcontractor_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for subcontractor payments
CREATE POLICY "Admins can manage subcontractor payments" 
ON public.subcontractor_payments 
FOR ALL 
USING (true);

CREATE POLICY "Subcontractors can view their own payments" 
ON public.subcontractor_payments 
FOR SELECT 
USING (subcontractor_id IN (
  SELECT id FROM public.subcontractors 
  WHERE user_id = auth.uid()
));

-- Create tier system configuration table
CREATE TABLE public.tier_system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_level INTEGER UNIQUE NOT NULL,
  tier_name TEXT NOT NULL,
  hourly_rate NUMERIC NOT NULL,
  monthly_fee NUMERIC NOT NULL,
  reviews_required INTEGER NOT NULL,
  jobs_required INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default tier configurations
INSERT INTO public.tier_system_config (tier_level, tier_name, hourly_rate, monthly_fee, reviews_required, jobs_required) VALUES
(1, 'Standard', 16.00, 25.00, 0, 0),
(2, 'Professional', 18.00, 50.00, 15, 20),
(3, 'Elite', 21.00, 65.00, 25, 30);

-- Enable RLS on tier system config
ALTER TABLE public.tier_system_config ENABLE ROW LEVEL SECURITY;

-- Create policies for tier system config
CREATE POLICY "Admins can manage tier system config" 
ON public.tier_system_config 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Anyone can view tier system config" 
ON public.tier_system_config 
FOR SELECT 
USING (is_active = true);

-- Add trigger for updated_at columns
CREATE TRIGGER update_subcontractor_payments_updated_at
  BEFORE UPDATE ON public.subcontractor_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tier_system_config_updated_at
  BEFORE UPDATE ON public.tier_system_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();