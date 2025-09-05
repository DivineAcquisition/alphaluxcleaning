-- Phase 1B: Create Core Tables (Simple Version)

-- Create customers table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
        CREATE TABLE public.customers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            first_name TEXT,
            last_name TEXT,
            email TEXT NOT NULL,
            phone TEXT,
            address_json JSONB DEFAULT '{}',
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            company_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000'
        );
    END IF;
END $$;

-- Create cleaners table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cleaners') THEN
        CREATE TABLE public.cleaners (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            pay_value NUMERIC DEFAULT 0,
            rating NUMERIC DEFAULT 5.0,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            company_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000'
        );
    END IF;
END $$;

-- Create jobs table if it doesn't exist  
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'jobs') THEN
        CREATE TABLE public.jobs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_id UUID,
            service_type TEXT NOT NULL,
            job_date DATE NOT NULL,
            time_window TEXT DEFAULT 'morning',
            duration_est_mins INTEGER DEFAULT 120,
            address_json JSONB DEFAULT '{}',
            special_instructions TEXT,
            price_cents INTEGER NOT NULL DEFAULT 0,
            status public.job_status DEFAULT 'unassigned',
            assigned_cleaner_id UUID,
            payout_cents INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            company_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000'
        );
    END IF;
END $$;

-- Enable RLS on tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Add simple RLS policies
CREATE POLICY "authenticated_users_can_view_customers" ON public.customers
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_users_can_view_cleaners" ON public.cleaners
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_users_can_view_jobs" ON public.jobs
    FOR SELECT USING (auth.uid() IS NOT NULL);