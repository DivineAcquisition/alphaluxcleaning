-- Database schema and RLS for Auth Infrastructure
-- Companies and company users (admin system)
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'trial',
  timezone TEXT DEFAULT 'America/Los_Angeles',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Company users for admin/staff access
CREATE TABLE IF NOT EXISTS public.company_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- Customers table (portal system)
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address JSONB DEFAULT '{}',
  notify_email BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, email)
);

-- Customer portal sessions for secure access
CREATE TABLE IF NOT EXISTS public.customer_portal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '8 hours'),
  revoked BOOLEAN DEFAULT false
);

-- Bookings with enhanced payment tracking
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'deposit_paid', 'paid', 'refunded'));
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS stripe_invoice_id TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS price_calc_meta JSONB DEFAULT '{}';

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_portal_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "company_users_can_read_company" ON public.companies
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for company_users
CREATE POLICY "users_can_read_own_company_membership" ON public.company_users
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for customers
CREATE POLICY "company_users_can_manage_customers" ON public.customers
  FOR ALL TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "customers_can_read_own_data" ON public.customers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for customer_portal_sessions  
CREATE POLICY "system_manages_portal_sessions" ON public.customer_portal_sessions
  FOR ALL TO authenticated
  USING (true);

-- Helper functions
CREATE OR REPLACE FUNCTION public.is_company_user(target_company_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_users 
    WHERE company_id = target_company_id 
    AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.get_current_customer_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT customer_id 
  FROM public.customer_portal_sessions 
  WHERE session_token = current_setting('app.customer_session_token', true)
  AND expires_at > now()
  AND NOT revoked
  LIMIT 1;
$$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_users_company_id ON public.company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_company_users_user_id ON public.company_users(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON public.customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customer_sessions_token ON public.customer_portal_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_customer_sessions_expires ON public.customer_portal_sessions(expires_at);

-- Updated timestamps trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER company_users_updated_at BEFORE UPDATE ON public.company_users  
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();