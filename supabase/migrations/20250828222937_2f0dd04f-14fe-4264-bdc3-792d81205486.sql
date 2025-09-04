-- Fix split_tier type issue - convert text to integer
UPDATE public.subcontractors 
SET split_tier = CASE 
    WHEN split_tier IS NULL OR split_tier = '' THEN tier_level::text
    ELSE split_tier
END
WHERE split_tier IS NULL OR split_tier = '';

-- Add missing columns to tier_system_config if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tier_system_config' AND column_name = 'requirements') THEN
        ALTER TABLE public.tier_system_config ADD COLUMN requirements JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tier_system_config' AND column_name = 'benefits') THEN
        ALTER TABLE public.tier_system_config ADD COLUMN benefits JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tier_system_config' AND column_name = 'is_active') THEN
        ALTER TABLE public.tier_system_config ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Update tier_system_config with proper data
UPDATE public.tier_system_config SET 
    requirements = CASE tier_level
        WHEN 1 THEN '{"reviews": 0, "jobs": 0}'::jsonb
        WHEN 2 THEN '{"reviews": 10, "jobs": 15}'::jsonb
        WHEN 3 THEN '{"reviews": 20, "jobs": 25}'::jsonb
        WHEN 4 THEN '{"reviews": 30, "jobs": 40}'::jsonb
        ELSE '{"reviews": 0, "jobs": 0}'::jsonb
    END,
    benefits = CASE tier_level
        WHEN 1 THEN '{"description": "Entry level tier for new subcontractors"}'::jsonb
        WHEN 2 THEN '{"description": "Professional tier with proven track record"}'::jsonb
        WHEN 3 THEN '{"description": "Elite tier for top performers"}'::jsonb
        WHEN 4 THEN '{"description": "Premium tier for exceptional subcontractors"}'::jsonb
        ELSE '{"description": "Standard tier"}'::jsonb
    END,
    is_active = COALESCE(is_active, true)
WHERE requirements IS NULL OR benefits IS NULL OR is_active IS NULL;

-- Create customer_profiles table
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

-- Create email logs table
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
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for new tables
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
CREATE POLICY "Admins can manage all customer profiles" ON public.customer_profiles FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Users can view their own profile" ON public.customer_profiles FOR SELECT USING (user_id = auth.uid() OR email = (auth.jwt() ->> 'email'));
CREATE POLICY "Users can update their own profile" ON public.customer_profiles FOR UPDATE USING (user_id = auth.uid() OR email = (auth.jwt() ->> 'email'));
CREATE POLICY "System can create customer profiles" ON public.customer_profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage email logs" ON public.email_logs FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "System can log emails" ON public.email_logs FOR INSERT WITH CHECK (true);