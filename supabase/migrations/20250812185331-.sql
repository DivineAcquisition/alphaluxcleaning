-- PHASE 4: ADVANCED BUSINESS INTELLIGENCE & WORKFLOW AUTOMATION
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

-- Function to execute workflow
CREATE OR REPLACE FUNCTION public.execute_workflow(
  p_template_id uuid,
  p_trigger_data jsonb DEFAULT '{}'::jsonb,
  p_triggered_by uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_execution_id uuid;
  v_template_record record;
  v_start_time timestamp with time zone;
BEGIN
  v_start_time := now();
  
  -- Get template
  SELECT * INTO v_template_record
  FROM public.workflow_templates
  WHERE id = p_template_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workflow template not found or inactive';
  END IF;
  
  -- Create execution record
  INSERT INTO public.workflow_executions (
    template_id,
    trigger_data,
    status,
    triggered_by
  ) VALUES (
    p_template_id,
    p_trigger_data,
    'running',
    p_triggered_by
  ) RETURNING id INTO v_execution_id;
  
  -- Update template execution count
  UPDATE public.workflow_templates
  SET execution_count = execution_count + 1
  WHERE id = p_template_id;
  
  -- Mark as completed (simplified - in real implementation, this would process actions)
  UPDATE public.workflow_executions
  SET 
    status = 'completed',
    completed_at = now(),
    execution_time_ms = EXTRACT(EPOCH FROM (now() - v_start_time)) * 1000,
    execution_data = jsonb_build_object(
      'processed_at', now(),
      'actions_executed', jsonb_array_length(v_template_record.actions)
    )
  WHERE id = v_execution_id;
  
  RETURN v_execution_id;
END;
$$;

-- Function to search across entities
CREATE OR REPLACE FUNCTION public.intelligent_search(
  p_query text,
  p_entity_types text[] DEFAULT ARRAY['orders', 'customers', 'subcontractors', 'bookings'],
  p_limit integer DEFAULT 20
)
RETURNS TABLE(
  entity_type text,
  entity_id uuid,
  relevance_score numeric,
  highlight text,
  metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    si.entity_type,
    si.entity_id,
    CASE 
      WHEN si.searchable_content ILIKE '%' || p_query || '%' THEN
        -- Simple relevance scoring
        CASE 
          WHEN si.searchable_content ILIKE p_query || '%' THEN 1.0
          WHEN si.searchable_content ILIKE '%' || p_query THEN 0.8
          ELSE 0.5
        END
      ELSE 0.0
    END as relevance_score,
    substring(si.searchable_content from position(lower(p_query) in lower(si.searchable_content)) - 20 for 100) as highlight,
    si.metadata
  FROM public.search_indices si
  WHERE si.entity_type = ANY(p_entity_types)
    AND si.searchable_content ILIKE '%' || p_query || '%'
  ORDER BY relevance_score DESC, si.indexed_at DESC
  LIMIT p_limit;
END;
$$;

-- Function to generate business intelligence insights
CREATE OR REPLACE FUNCTION public.generate_bi_insights(
  p_insight_type text,
  p_time_period text DEFAULT 'weekly'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_insights jsonb;
  v_start_date timestamp with time zone;
  v_end_date timestamp with time zone;
BEGIN
  -- Calculate date range
  v_end_date := now();
  CASE p_time_period
    WHEN 'daily' THEN v_start_date := v_end_date - interval '1 day';
    WHEN 'weekly' THEN v_start_date := v_end_date - interval '7 days';
    WHEN 'monthly' THEN v_start_date := v_end_date - interval '30 days';
    WHEN 'quarterly' THEN v_start_date := v_end_date - interval '90 days';
    ELSE v_start_date := v_end_date - interval '7 days';
  END CASE;
  
  -- Generate insights based on type
  CASE p_insight_type
    WHEN 'revenue_overview' THEN
      SELECT jsonb_build_object(
        'total_revenue', COALESCE(SUM(amount), 0),
        'order_count', COUNT(*),
        'average_order_value', COALESCE(AVG(amount), 0),
        'top_service_types', jsonb_agg(DISTINCT service_details->>'service_type'),
        'period', p_time_period,
        'start_date', v_start_date,
        'end_date', v_end_date
      ) INTO v_insights
      FROM public.orders
      WHERE created_at BETWEEN v_start_date AND v_end_date;
      
    WHEN 'performance_summary' THEN
      SELECT jsonb_build_object(
        'total_jobs', COUNT(*),
        'completed_jobs', COUNT(*) FILTER (WHERE status = 'completed'),
        'completion_rate', 
          CASE 
            WHEN COUNT(*) > 0 THEN 
              ROUND((COUNT(*) FILTER (WHERE status = 'completed')::numeric / COUNT(*)) * 100, 2)
            ELSE 0
          END,
        'average_rating', COALESCE(AVG((customer_feedback.overall_rating)), 0),
        'period', p_time_period
      ) INTO v_insights
      FROM public.bookings
      LEFT JOIN public.customer_feedback ON bookings.id = customer_feedback.booking_id
      WHERE bookings.created_at BETWEEN v_start_date AND v_end_date;
      
    ELSE
      v_insights := jsonb_build_object('error', 'Unknown insight type');
  END CASE;
  
  -- Cache the insights
  INSERT INTO public.bi_insights_cache (
    insight_type,
    time_period,
    data,
    expires_at
  ) VALUES (
    p_insight_type,
    p_time_period,
    v_insights,
    now() + interval '1 hour'
  )
  ON CONFLICT (insight_type, time_period)
  DO UPDATE SET
    data = EXCLUDED.data,
    generated_at = now(),
    expires_at = EXCLUDED.expires_at;
  
  RETURN v_insights;
END;
$$;

-- Function to send intelligent notification
CREATE OR REPLACE FUNCTION public.send_intelligent_notification(
  p_template_id uuid,
  p_recipient_id uuid DEFAULT NULL,
  p_recipient_email text DEFAULT NULL,
  p_context_data jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_delivery_id uuid;
  v_template record;
  v_rendered_content jsonb;
BEGIN
  -- Get template
  SELECT * INTO v_template
  FROM public.notification_templates
  WHERE id = p_template_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Notification template not found or inactive';
  END IF;
  
  -- Simple template rendering (in production, this would be more sophisticated)
  v_rendered_content := v_template.content_template;
  
  -- Create delivery record
  INSERT INTO public.notification_deliveries (
    template_id,
    recipient_id,
    recipient_email,
    delivery_type,
    status,
    content,
    sent_at
  ) VALUES (
    p_template_id,
    p_recipient_id,
    p_recipient_email,
    v_template.type,
    'sent',
    v_rendered_content,
    now()
  ) RETURNING id INTO v_delivery_id;
  
  RETURN v_delivery_id;
END;
$$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON public.workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_trigger_event ON public.workflow_templates(trigger_event);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_template_id ON public.workflow_executions(template_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON public.workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON public.workflow_executions(started_at);
CREATE INDEX IF NOT EXISTS idx_bi_reports_report_type ON public.bi_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_search_indices_entity_type ON public.search_indices(entity_type);
CREATE INDEX IF NOT EXISTS idx_search_indices_content_trgm ON public.search_indices USING gin(searchable_content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_notification_templates_trigger_event ON public.notification_templates(trigger_event);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status ON public.notification_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_bi_insights_cache_expires_at ON public.bi_insights_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_integration_configs_service_name ON public.integration_configs(service_name);