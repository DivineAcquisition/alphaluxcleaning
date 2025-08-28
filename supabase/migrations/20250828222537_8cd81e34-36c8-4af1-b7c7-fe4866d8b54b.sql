-- Fix subcontractor creation issue and add email infrastructure

-- First, check if split_tier column exists and add default if needed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subcontractors' AND column_name = 'split_tier'
    ) THEN
        ALTER TABLE public.subcontractors ADD COLUMN split_tier INTEGER NOT NULL DEFAULT 1;
    END IF;
END $$;

-- Update existing records to have split_tier if they don't
UPDATE public.subcontractors SET split_tier = tier_level WHERE split_tier IS NULL;

-- Create tier_system_config table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tier_system_config (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tier_level INTEGER NOT NULL UNIQUE,
    tier_name TEXT NOT NULL,
    hourly_rate NUMERIC(10,2) NOT NULL,
    monthly_fee NUMERIC(10,2) NOT NULL,
    requirements JSONB DEFAULT '{}',
    benefits JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default tier configuration
INSERT INTO public.tier_system_config (tier_level, tier_name, hourly_rate, monthly_fee, requirements, benefits) VALUES
(1, 'Standard', 14.00, 25.00, '{"reviews": 0, "jobs": 0}', '{"description": "Entry level tier for new subcontractors"}'),
(2, 'Professional', 16.00, 40.00, '{"reviews": 10, "jobs": 15}', '{"description": "Professional tier with proven track record"}'),
(3, 'Elite', 18.00, 55.00, '{"reviews": 20, "jobs": 25}', '{"description": "Elite tier for top performers"}'),
(4, 'Premium', 20.00, 70.00, '{"reviews": 30, "jobs": 40}', '{"description": "Premium tier for exceptional subcontractors"}')
ON CONFLICT (tier_level) DO NOTHING;

-- Create order_tips table for tips management
CREATE TABLE IF NOT EXISTS public.order_tips (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id),
    subcontractor_id UUID REFERENCES public.subcontractors(id),
    customer_email TEXT NOT NULL,
    customer_name TEXT,
    tip_amount_cents INTEGER NOT NULL,
    tip_percentage NUMERIC(5,2),
    customer_message TEXT,
    payment_method TEXT DEFAULT 'stripe',
    stripe_payment_intent_id TEXT,
    distribution_method TEXT DEFAULT 'direct',
    distributed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create email infrastructure tables
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_email TEXT NOT NULL,
    sender_email TEXT,
    subject TEXT NOT NULL,
    template_id UUID,
    email_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    provider TEXT DEFAULT 'resend',
    provider_message_id TEXT,
    metadata JSONB DEFAULT '{}',
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    bounced_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    subject_template TEXT NOT NULL,
    html_template TEXT NOT NULL,
    text_template TEXT,
    sms_template TEXT,
    template_variables JSONB DEFAULT '[]',
    category TEXT DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create customer_profiles table for better customer management
CREATE TABLE IF NOT EXISTS public.customer_profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    customer_since DATE DEFAULT CURRENT_DATE,
    total_orders INTEGER DEFAULT 0,
    total_spent_cents INTEGER DEFAULT 0,
    average_rating NUMERIC(3,2),
    last_service_date DATE,
    preferred_time TEXT,
    special_instructions TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for new tables
ALTER TABLE public.tier_system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage tier config" ON public.tier_system_config FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Anyone can view active tier config" ON public.tier_system_config FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all tips" ON public.order_tips FOR SELECT USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Subcontractors can view their tips" ON public.order_tips FOR SELECT USING (subcontractor_id IN (SELECT id FROM subcontractors WHERE user_id = auth.uid()));
CREATE POLICY "System can insert tips" ON public.order_tips FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage email logs" ON public.email_logs FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "System can log emails" ON public.email_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage notification templates" ON public.notification_templates FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Anyone can view active templates" ON public.notification_templates FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all customer profiles" ON public.customer_profiles FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Users can view their own profile" ON public.customer_profiles FOR SELECT USING (user_id = auth.uid() OR email = (auth.jwt() ->> 'email'));
CREATE POLICY "Users can update their own profile" ON public.customer_profiles FOR UPDATE USING (user_id = auth.uid() OR email = (auth.jwt() ->> 'email'));
CREATE POLICY "System can create customer profiles" ON public.customer_profiles FOR INSERT WITH CHECK (true);