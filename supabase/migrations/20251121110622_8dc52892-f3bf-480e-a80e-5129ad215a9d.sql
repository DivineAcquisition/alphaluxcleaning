-- Create waitlist_leads table
CREATE TABLE public.waitlist_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  zip_code TEXT,
  home_size TEXT,
  preferred_contact TEXT CHECK (preferred_contact IN ('email', 'phone', 'text')),
  ready_timeline TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'converted', 'unsubscribed')),
  source TEXT DEFAULT 'waitlist_page',
  promo_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  converted_at TIMESTAMP WITH TIME ZONE,
  converted_booking_id UUID REFERENCES public.bookings(id)
);

-- Enable RLS
ALTER TABLE public.waitlist_leads ENABLE ROW LEVEL SECURITY;

-- Admins can view all waitlist leads
CREATE POLICY "Admins can view all waitlist leads"
ON public.waitlist_leads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- Service role can manage all waitlist leads
CREATE POLICY "Service role can manage waitlist leads"
ON public.waitlist_leads
FOR ALL
USING (auth.role() = 'service_role');

-- Insert DEEPCLEAN60 promo code
INSERT INTO public.promo_codes (
  code,
  type,
  amount_cents,
  currency,
  active,
  applies_to,
  service_type_restriction,
  min_subtotal_cents,
  max_redemptions,
  metadata
) VALUES (
  'DEEPCLEAN60',
  'FIXED',
  6000,
  'USD',
  true,
  'ONE_TIME',
  'deep',
  20000,
  999999,
  '{"source": "waitlist_campaign", "description": "Waitlist upsell offer - $60 off deep clean services"}'::jsonb
) ON CONFLICT (code) DO UPDATE SET
  active = true,
  amount_cents = 6000,
  service_type_restriction = 'deep',
  min_subtotal_cents = 20000;