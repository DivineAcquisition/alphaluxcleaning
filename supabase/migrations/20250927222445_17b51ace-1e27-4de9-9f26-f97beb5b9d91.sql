-- Fix the admin_users table to have the correct user_id that matches auth.users
UPDATE admin_users 
SET user_id = '9293caa5-8987-410d-8131-4a5291d8f520' 
WHERE email = 'info@alphaluxclean.com' AND user_id = '35f0d01e-4c9b-4baa-af7c-bb9696672e5b';

-- Create referral config table for the $50 reward system
CREATE TABLE IF NOT EXISTS public.referral_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_amount decimal NOT NULL DEFAULT 50.00,
  currency text NOT NULL DEFAULT 'USD',
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert the $50 reward configuration
INSERT INTO public.referral_config (reward_amount) VALUES (50.00)
ON CONFLICT DO NOTHING;

-- Enable RLS on referral_config
ALTER TABLE public.referral_config ENABLE ROW LEVEL SECURITY;

-- Create policy for reading referral config (public read access)
CREATE POLICY "Anyone can view referral config"
ON public.referral_config
FOR SELECT
USING (active = true);

-- Create policy for admins to manage referral config
CREATE POLICY "Admins can manage referral config"
ON public.referral_config
FOR ALL
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() 
  AND status = 'active' 
  AND role IN ('admin', 'ops')
));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_referral_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_referral_config_updated_at
  BEFORE UPDATE ON public.referral_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_referral_config_updated_at();