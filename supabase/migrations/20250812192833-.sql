-- PHASE 4: ADVANCED BUSINESS INTELLIGENCE & WORKFLOW AUTOMATION (Fixed)
-- Create intelligent automation and advanced analytics infrastructure

-- Workflow templates for automated business processes
CREATE TABLE IF NOT EXISTS public.workflow_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text NOT NULL, -- booking, payment, customer_service, operations
  trigger_event text NOT NULL,
  trigger_conditions jsonb DEFAULT '{}'::jsonb,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  execution_count integer DEFAULT 0,
  success_rate numeric(4,2) DEFAULT 100.00
);

-- Workflow executions log
CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid REFERENCES public.workflow_templates(id) ON DELETE CASCADE,
  trigger_data jsonb,
  execution_data jsonb,
  status text NOT NULL DEFAULT 'pending', -- pending, running, completed, failed, cancelled
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  error_message text,
  execution_time_ms integer,
  triggered_by uuid REFERENCES auth.users(id)
);

-- Business intelligence reports configuration
CREATE TABLE IF NOT EXISTS public.bi_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  report_type text NOT NULL, -- revenue, performance, customer, operational
  data_sources text[] NOT NULL,
  filters jsonb DEFAULT '{}'::jsonb,
  visualization_config jsonb DEFAULT '{}'::jsonb,
  schedule_config jsonb, -- for automated reports
  is_public boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_generated timestamp with time zone,
  generation_count integer DEFAULT 0
);

-- Advanced search and filtering system
CREATE TABLE IF NOT EXISTS public.search_indices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type text NOT NULL, -- orders, customers, subcontractors, bookings
  entity_id uuid NOT NULL,
  searchable_content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  indexed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(entity_type, entity_id)
);

-- Intelligent notifications system
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL, -- email, sms, push, in_app
  trigger_event text NOT NULL,
  recipient_rules jsonb NOT NULL, -- who gets notified
  content_template jsonb NOT NULL, -- subject, body, etc.
  delivery_settings jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  priority text DEFAULT 'normal', -- low, normal, high, urgent
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Notification delivery log
CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid REFERENCES public.notification_templates(id),
  recipient_id uuid REFERENCES auth.users(id),
  recipient_email text,
  recipient_phone text,
  delivery_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, sent, delivered, failed, bounced
  content jsonb,
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  error_message text,
  external_id text -- for tracking with external services
);

-- Business intelligence insights cache
CREATE TABLE IF NOT EXISTS public.bi_insights_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insight_type text NOT NULL,
  time_period text NOT NULL, -- daily, weekly, monthly, quarterly
  data jsonb NOT NULL,
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  UNIQUE(insight_type, time_period)
);

-- Integration configurations
CREATE TABLE IF NOT EXISTS public.integration_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name text NOT NULL UNIQUE,
  config_data jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_sync timestamp with time zone,
  sync_status text DEFAULT 'idle' -- idle, syncing, error
);

-- Enable RLS on all new tables
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bi_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_indices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bi_insights_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflow templates
CREATE POLICY "Admins can manage workflow templates"
ON public.workflow_templates
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can view active workflow templates"
ON public.workflow_templates
FOR SELECT
TO authenticated
USING (is_active = true);

-- RLS Policies for workflow executions
CREATE POLICY "Admins can manage workflow executions"
ON public.workflow_executions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can view their triggered executions"
ON public.workflow_executions
FOR SELECT
TO authenticated
USING (triggered_by = auth.uid());

-- RLS Policies for BI reports
CREATE POLICY "Admins can manage BI reports"
ON public.bi_reports
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can view public reports"
ON public.bi_reports
FOR SELECT
TO authenticated
USING (is_public = true);

CREATE POLICY "Users can view their own reports"
ON public.bi_reports
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

-- RLS Policies for search indices
CREATE POLICY "System can manage search indices"
ON public.search_indices
FOR ALL
WITH CHECK (true);

CREATE POLICY "Users can search indices"
ON public.search_indices
FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for notification templates
CREATE POLICY "Admins can manage notification templates"
ON public.notification_templates
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for notification deliveries
CREATE POLICY "Admins can view all notification deliveries"
ON public.notification_deliveries
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can view their own notification deliveries"
ON public.notification_deliveries
FOR SELECT
TO authenticated
USING (recipient_id = auth.uid());

CREATE POLICY "System can insert notification deliveries"
ON public.notification_deliveries
FOR INSERT
WITH CHECK (true);

-- RLS Policies for BI insights cache
CREATE POLICY "Admins can manage BI insights cache"
ON public.bi_insights_cache
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for integration configs
CREATE POLICY "Admins can manage integration configs"
ON public.integration_configs
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Indexes for performance (without text search extension)
CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON public.workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_trigger_event ON public.workflow_templates(trigger_event);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_template_id ON public.workflow_executions(template_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON public.workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON public.workflow_executions(started_at);
CREATE INDEX IF NOT EXISTS idx_bi_reports_report_type ON public.bi_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_search_indices_entity_type ON public.search_indices(entity_type);
CREATE INDEX IF NOT EXISTS idx_search_indices_content ON public.search_indices(searchable_content);
CREATE INDEX IF NOT EXISTS idx_notification_templates_trigger_event ON public.notification_templates(trigger_event);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status ON public.notification_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_bi_insights_cache_expires_at ON public.bi_insights_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_integration_configs_service_name ON public.integration_configs(service_name);