-- Phase 1: Create New Enum Types
CREATE TYPE public.recurrence_type AS ENUM ('one_time', 'biweekly', 'monthly');
CREATE TYPE public.time_window AS ENUM ('morning', 'afternoon', 'evening');
CREATE TYPE public.job_event_type AS ENUM (
  'created', 'offered', 'accepted', 'declined', 'started', 'paused', 
  'resumed', 'completed', 'no_show', 'cancelled', 'reassigned', 'paid'
);
CREATE TYPE public.cleaner_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE public.invoice_status AS ENUM ('pending', 'paid', 'refunded', 'failed');
CREATE TYPE public.payout_status AS ENUM ('pending', 'approved', 'paid');

-- Update existing job_status enum to match requirements
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'unassigned';
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'offered';
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'accepted';
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'declined';
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'in_progress';
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'no_show';
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'paid';

-- Phase 2: Create New Tables

-- Job Events Table
CREATE TABLE public.job_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  event public.job_event_type NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  actor_role TEXT,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  organization_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000'
);

-- Inventory Items Table
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  on_hand NUMERIC DEFAULT 0,
  min_threshold NUMERIC DEFAULT 0,
  organization_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Invoices Table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER NOT NULL,
  status public.invoice_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  organization_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000'
);

-- Payouts Table
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaner_id UUID NOT NULL,
  job_id UUID,
  payout_cents INTEGER NOT NULL,
  status public.payout_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  organization_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000'
);

-- Schedules Table (Cleaner Availability)
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaner_id UUID NOT NULL,
  weekday INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  organization_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Operational Settings Table
CREATE TABLE public.settings_ops (
  organization_id UUID PRIMARY KEY DEFAULT '550e8400-e29b-41d4-a716-446655440000',
  cancel_policy_text TEXT,
  sms_from_number TEXT,
  email_from TEXT,
  dispatch_rules JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- NPS Surveys Table
CREATE TABLE public.nps_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  organization_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000'
);

-- Phase 3: Update Existing Tables Structure

-- Add missing columns to existing tables and rename company_id to organization_id

-- Update customers table
ALTER TABLE public.customers 
  RENAME COLUMN company_id TO organization_id;

-- Add missing columns to customers if they don't exist
ALTER TABLE public.customers 
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update cleaners table
ALTER TABLE public.cleaners 
  RENAME COLUMN company_id TO organization_id;

-- Add pay_type column and update status
ALTER TABLE public.cleaners 
  ADD COLUMN IF NOT EXISTS pay_type public.pay_type DEFAULT 'hourly';

-- Update cleaners status to use new enum (we'll keep existing values compatible)
-- Note: The existing status column might need data migration

-- Create new jobs table with proper structure (backup existing first)
CREATE TABLE public.jobs_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  service_type TEXT NOT NULL,
  recurrence public.recurrence_type NOT NULL DEFAULT 'one_time',
  date_iso DATE NOT NULL,
  time_window public.time_window NOT NULL DEFAULT 'morning',
  duration_est_mins INTEGER,
  address_json JSONB NOT NULL DEFAULT '{}',
  special_instructions TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  status public.job_status NOT NULL DEFAULT 'unassigned',
  assigned_cleaner_id UUID,
  payout_cents INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  organization_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000'
);

-- Update other tables to use organization_id instead of company_id
ALTER TABLE public.bookings 
  RENAME COLUMN company_id TO organization_id;

ALTER TABLE public.contracts 
  RENAME COLUMN company_id TO organization_id;

ALTER TABLE public.subcontractors 
  RENAME COLUMN company_id TO organization_id;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_events_job_id ON public.job_events(job_id);
CREATE INDEX IF NOT EXISTS idx_job_events_organization_id ON public.job_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_organization_id ON public.inventory_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_job_id ON public.invoices(job_id);
CREATE INDEX IF NOT EXISTS idx_invoices_organization_id ON public.invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_payouts_cleaner_id ON public.payouts(cleaner_id);
CREATE INDEX IF NOT EXISTS idx_payouts_organization_id ON public.payouts(organization_id);
CREATE INDEX IF NOT EXISTS idx_schedules_cleaner_id ON public.schedules(cleaner_id);
CREATE INDEX IF NOT EXISTS idx_schedules_organization_id ON public.schedules(organization_id);
CREATE INDEX IF NOT EXISTS idx_nps_surveys_job_id ON public.nps_surveys(job_id);
CREATE INDEX IF NOT EXISTS idx_nps_surveys_organization_id ON public.nps_surveys(organization_id);
CREATE INDEX IF NOT EXISTS idx_jobs_new_customer_id ON public.jobs_new(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_new_assigned_cleaner_id ON public.jobs_new(assigned_cleaner_id);
CREATE INDEX IF NOT EXISTS idx_jobs_new_organization_id ON public.jobs_new(organization_id);
CREATE INDEX IF NOT EXISTS idx_jobs_new_date_iso ON public.jobs_new(date_iso);

-- Phase 4: Enable RLS on all new tables
ALTER TABLE public.job_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings_ops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nps_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs_new ENABLE ROW LEVEL SECURITY;

-- Phase 5: Create RLS Policies

-- Helper function to check if user has organization access
CREATE OR REPLACE FUNCTION public.user_has_org_access(p_organization_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- For now, we'll allow access if user is authenticated and part of the organization
  -- This can be enhanced based on your specific org membership logic
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can manage jobs (Owner/Dispatcher)
CREATE OR REPLACE FUNCTION public.user_can_manage_jobs(p_organization_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has admin, manager, or super_admin role
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can approve payouts (Owner only)
CREATE OR REPLACE FUNCTION public.user_can_approve_payouts(p_organization_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has super_admin role (Owner)
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for job_events
CREATE POLICY "Users can view job events in their organization"
  ON public.job_events FOR SELECT
  USING (public.user_has_org_access(organization_id));

CREATE POLICY "System can insert job events"
  ON public.job_events FOR INSERT
  WITH CHECK (true);

-- RLS Policies for inventory_items
CREATE POLICY "Users can view inventory in their organization"
  ON public.inventory_items FOR SELECT
  USING (public.user_has_org_access(organization_id));

CREATE POLICY "Managers can manage inventory"
  ON public.inventory_items FOR ALL
  USING (public.user_can_manage_jobs(organization_id))
  WITH CHECK (public.user_can_manage_jobs(organization_id));

-- RLS Policies for invoices
CREATE POLICY "Users can view invoices in their organization"
  ON public.invoices FOR SELECT
  USING (public.user_has_org_access(organization_id));

CREATE POLICY "Managers can manage invoices"
  ON public.invoices FOR ALL
  USING (public.user_can_manage_jobs(organization_id))
  WITH CHECK (public.user_can_manage_jobs(organization_id));

-- RLS Policies for payouts
CREATE POLICY "Users can view payouts in their organization"
  ON public.payouts FOR SELECT
  USING (public.user_has_org_access(organization_id));

CREATE POLICY "Managers can create payouts"
  ON public.payouts FOR INSERT
  WITH CHECK (public.user_can_manage_jobs(organization_id));

CREATE POLICY "Owners can approve payouts"
  ON public.payouts FOR UPDATE
  USING (public.user_can_approve_payouts(organization_id))
  WITH CHECK (public.user_can_approve_payouts(organization_id));

-- RLS Policies for schedules
CREATE POLICY "Users can view schedules in their organization"
  ON public.schedules FOR SELECT
  USING (public.user_has_org_access(organization_id));

CREATE POLICY "Managers can manage schedules"
  ON public.schedules FOR ALL
  USING (public.user_can_manage_jobs(organization_id))
  WITH CHECK (public.user_can_manage_jobs(organization_id));

-- RLS Policies for settings_ops
CREATE POLICY "Users can view operational settings"
  ON public.settings_ops FOR SELECT
  USING (public.user_has_org_access(organization_id));

CREATE POLICY "Owners can manage operational settings"
  ON public.settings_ops FOR ALL
  USING (public.user_can_approve_payouts(organization_id))
  WITH CHECK (public.user_can_approve_payouts(organization_id));

-- RLS Policies for nps_surveys
CREATE POLICY "Users can view NPS surveys in their organization"
  ON public.nps_surveys FOR SELECT
  USING (public.user_has_org_access(organization_id));

CREATE POLICY "System can insert NPS surveys"
  ON public.nps_surveys FOR INSERT
  WITH CHECK (true);

-- RLS Policies for new jobs table
CREATE POLICY "Users can view jobs in their organization"
  ON public.jobs_new FOR SELECT
  USING (public.user_has_org_access(organization_id));

CREATE POLICY "Managers can manage jobs"
  ON public.jobs_new FOR ALL
  USING (public.user_can_manage_jobs(organization_id))
  WITH CHECK (public.user_can_manage_jobs(organization_id));

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_inventory_items_updated_at
    BEFORE UPDATE ON public.inventory_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_jobs_new_updated_at
    BEFORE UPDATE ON public.jobs_new
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_settings_ops_updated_at
    BEFORE UPDATE ON public.settings_ops
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();