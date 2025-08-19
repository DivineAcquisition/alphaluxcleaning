-- Create customer notification preferences table if not exists
CREATE TABLE IF NOT EXISTS public.customer_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  phone_number TEXT,
  service_reminders BOOLEAN DEFAULT true,
  booking_confirmations BOOLEAN DEFAULT true,
  payment_notifications BOOLEAN DEFAULT true,
  promotional_messages BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(customer_id)
);

-- Enable RLS
ALTER TABLE public.customer_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own notification preferences"
ON public.customer_notification_preferences
FOR ALL
USING (customer_id = auth.uid());

-- Add missing columns to profiles table for better customer data
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS customer_since TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Ensure customer role is properly assigned to new users
CREATE OR REPLACE FUNCTION public.assign_customer_role_to_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert customer role for new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Create default notification preferences
  INSERT INTO public.customer_notification_preferences (customer_id)
  VALUES (NEW.id)
  ON CONFLICT (customer_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_customer_role_to_new_user();