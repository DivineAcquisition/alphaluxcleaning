-- Phase 1: Core Data Model Extension for Contractor Management System

-- Create enum types
CREATE TYPE public.contractor_rate_type AS ENUM ('hourly', 'flat', 'commission');
CREATE TYPE public.contractor_status AS ENUM ('active', 'onboarding', 'inactive');
CREATE TYPE public.payout_account_status AS ENUM ('none', 'pending', 'verified');
CREATE TYPE public.job_status AS ENUM ('draft', 'awaiting_acceptance', 'assigned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.pricing_model AS ENUM ('hourly', 'flat');
CREATE TYPE public.acceptance_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
CREATE TYPE public.timesheet_status AS ENUM ('submitted', 'manager_review', 'approved', 'rejected');
CREATE TYPE public.payroll_period_status AS ENUM ('open', 'locked', 'paid');
CREATE TYPE public.pay_type AS ENUM ('hourly', 'flat', 'commission', 'overtime');
CREATE TYPE public.payroll_record_status AS ENUM ('pending', 'approved', 'sent', 'completed', 'disputed');
CREATE TYPE public.payout_method AS ENUM ('manual', 'bank_transfer');
CREATE TYPE public.payout_status AS ENUM ('initiated', 'completed', 'failed');
CREATE TYPE public.message_channel AS ENUM ('sms', 'email');
CREATE TYPE public.message_status AS ENUM ('queued', 'sent', 'delivered', 'failed');
CREATE TYPE public.webhook_target AS ENUM ('ghl', 'twilio', 'resend');
CREATE TYPE public.webhook_status AS ENUM ('queued', 'sent', 'failed');

-- Extend existing subcontractors table with contractor-specific fields
ALTER TABLE public.subcontractors 
ADD COLUMN IF NOT EXISTS base_rate_type contractor_rate_type DEFAULT 'hourly',
ADD COLUMN IF NOT EXISTS base_rate_value NUMERIC(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS service_zones TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tax_form_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS insurance_expiry DATE,
ADD COLUMN IF NOT EXISTS payout_account_status payout_account_status DEFAULT 'none',
ADD COLUMN IF NOT EXISTS flags_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS contractor_status contractor_status DEFAULT 'onboarding';

-- Create clients table for end customers
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  name TEXT NOT NULL,
  contact_json JSONB DEFAULT '{}',
  address_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Create jobs table for contractor-focused job management
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  client_id UUID REFERENCES public.clients(id),
  service_type TEXT NOT NULL,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  location_json JSONB DEFAULT '{}',
  instructions_text TEXT,
  status job_status DEFAULT 'draft',
  pricing_model pricing_model DEFAULT 'hourly',
  price_quote NUMERIC(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Create job_assignments table
CREATE TABLE public.job_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  assigned_by UUID,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  acceptance_status acceptance_status DEFAULT 'pending',
  acceptance_at TIMESTAMPTZ,
  respond_token_id UUID, -- Will reference magic_tokens.id
  pay_override_type contractor_rate_type,
  pay_override_value NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  UNIQUE(job_id, contractor_id)
);

-- Create enhanced timesheets table
CREATE TABLE public.timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  break_minutes INTEGER DEFAULT 0,
  hours_calc NUMERIC(10,3) GENERATED ALWAYS AS (
    GREATEST(0, (EXTRACT(EPOCH FROM (end_time - start_time))/3600.0) - (break_minutes/60.0))
  ) STORED,
  notes_text TEXT,
  evidence_urls TEXT[] DEFAULT '{}',
  status timesheet_status DEFAULT 'submitted',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Create payroll_periods table
CREATE TABLE public.payroll_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  period_start DATE NOT NULL, -- Monday
  period_end DATE NOT NULL,   -- Sunday
  status payroll_period_status DEFAULT 'open',
  totals_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  UNIQUE(company_id, period_start, period_end)
);

-- Create payroll_records table
CREATE TABLE public.payroll_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  payroll_period_id UUID REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id),
  timesheet_id UUID REFERENCES public.timesheets(id),
  pay_type pay_type NOT NULL,
  units NUMERIC(10,3) NOT NULL,
  rate NUMERIC(10,2) NOT NULL,
  bonus NUMERIC(10,2) DEFAULT 0,
  deduction NUMERIC(10,2) DEFAULT 0,
  pay_calc NUMERIC(10,2) GENERATED ALWAYS AS ((units * rate) + bonus - deduction) STORED,
  status payroll_record_status DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  UNIQUE(company_id, timesheet_id, pay_type)
);

-- Create payouts table
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  payroll_record_id UUID REFERENCES public.payroll_records(id) ON DELETE CASCADE,
  method payout_method DEFAULT 'manual',
  amount NUMERIC(10,2) NOT NULL,
  processor_ref TEXT,
  status payout_status DEFAULT 'initiated',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Create magic_tokens table for secure contractor actions
CREATE TABLE public.magic_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  token_hmac TEXT UNIQUE NOT NULL,
  entity TEXT NOT NULL, -- 'job_assignment'
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'accept', 'decline'
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create shortlinks table for URL management
CREATE TABLE public.shortlinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  slug TEXT UNIQUE NOT NULL,
  url TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create communication preferences table
CREATE TABLE public.comms_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  contractor_id UUID REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  allow_sms BOOLEAN DEFAULT true,
  allow_email BOOLEAN DEFAULT true,
  preferred_channel message_channel DEFAULT 'sms',
  locale TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(contractor_id)
);

-- Create enhanced message templates table
CREATE TABLE public.contractor_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  code TEXT NOT NULL, -- 'JOB_ASSIGNED', 'REMINDER_2H', 'TIMESHEET_REJECTED', 'PAYOUT_SENT'
  channel message_channel NOT NULL,
  subject TEXT, -- nullable for SMS
  body_text TEXT NOT NULL, -- supports {{variables}}
  version INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, code, channel, version)
);

-- Create contractor messages table
CREATE TABLE public.contractor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  to_contractor_id UUID REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  channel message_channel NOT NULL,
  template_code TEXT NOT NULL,
  payload_json JSONB DEFAULT '{}',
  status message_status DEFAULT 'queued',
  external_id TEXT,
  error_text TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create delivery logs table
CREATE TABLE public.delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  message_id UUID REFERENCES public.contractor_messages(id) ON DELETE CASCADE,
  provider webhook_target NOT NULL,
  event TEXT NOT NULL, -- 'sent', 'delivered', 'failed', 'opened', 'clicked'
  raw_json JSONB DEFAULT '{}',
  at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create webhooks outbox table
CREATE TABLE public.contractor_webhooks_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  target webhook_target NOT NULL,
  event_code TEXT NOT NULL, -- 'send_sms', 'send_email'
  payload_json JSONB NOT NULL,
  status webhook_status DEFAULT 'queued',
  retries INTEGER DEFAULT 0,
  last_error TEXT,
  next_attempt TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create inbound events table
CREATE TABLE public.inbound_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  provider webhook_target NOT NULL,
  kind TEXT NOT NULL, -- 'sms_reply', 'email_click', 'webhook'
  payload_json JSONB DEFAULT '{}',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key for respond_token_id after magic_tokens is created
ALTER TABLE public.job_assignments 
ADD CONSTRAINT fk_job_assignments_respond_token 
FOREIGN KEY (respond_token_id) REFERENCES public.magic_tokens(id);

-- Create indexes for performance
CREATE INDEX idx_clients_company_id ON public.clients(company_id);
CREATE INDEX idx_jobs_company_id_status ON public.jobs(company_id, status);
CREATE INDEX idx_jobs_scheduled_start ON public.jobs(scheduled_start);
CREATE INDEX idx_job_assignments_company_id_contractor ON public.job_assignments(company_id, contractor_id);
CREATE INDEX idx_job_assignments_status ON public.job_assignments(acceptance_status);
CREATE INDEX idx_timesheets_company_id_contractor ON public.timesheets(company_id, contractor_id);
CREATE INDEX idx_timesheets_status ON public.timesheets(status);
CREATE INDEX idx_payroll_records_period_contractor ON public.payroll_records(payroll_period_id, contractor_id);
CREATE INDEX idx_magic_tokens_token_hmac ON public.magic_tokens(token_hmac);
CREATE INDEX idx_magic_tokens_entity ON public.magic_tokens(entity, entity_id);
CREATE INDEX idx_shortlinks_slug ON public.shortlinks(slug);
CREATE INDEX idx_contractor_messages_contractor_status ON public.contractor_messages(to_contractor_id, status);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_job_assignments_updated_at BEFORE UPDATE ON public.job_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_timesheets_updated_at BEFORE UPDATE ON public.timesheets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payroll_periods_updated_at BEFORE UPDATE ON public.payroll_periods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payroll_records_updated_at BEFORE UPDATE ON public.payroll_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON public.payouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_magic_tokens_updated_at BEFORE UPDATE ON public.magic_tokens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shortlinks_updated_at BEFORE UPDATE ON public.shortlinks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_comms_preferences_updated_at BEFORE UPDATE ON public.comms_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contractor_message_templates_updated_at BEFORE UPDATE ON public.contractor_message_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contractor_messages_updated_at BEFORE UPDATE ON public.contractor_messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contractor_webhooks_outbox_updated_at BEFORE UPDATE ON public.contractor_webhooks_outbox FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inbound_events_updated_at BEFORE UPDATE ON public.inbound_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();