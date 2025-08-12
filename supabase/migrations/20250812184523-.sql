-- PHASE 3: PERFORMANCE OPTIMIZATION & UI/UX ENHANCEMENTS
-- Create performance monitoring and user experience tracking

-- Performance metrics table for tracking app performance
CREATE TABLE IF NOT EXISTS public.performance_metrics_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  session_id text,
  page_url text NOT NULL,
  load_time_ms integer,
  first_contentful_paint_ms integer,
  largest_contentful_paint_ms integer,
  cumulative_layout_shift numeric(4,3),
  first_input_delay_ms integer,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  user_agent text,
  device_type text,
  connection_type text,
  bundle_size_kb integer
);

-- User interaction tracking for UX optimization
CREATE TABLE IF NOT EXISTS public.user_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  session_id text NOT NULL,
  interaction_type text NOT NULL, -- click, scroll, form_submit, navigation, etc.
  element_id text,
  element_type text,
  page_url text NOT NULL,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  duration_ms integer,
  success boolean DEFAULT true,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Feature usage analytics
CREATE TABLE IF NOT EXISTS public.feature_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  feature_name text NOT NULL,
  usage_count integer DEFAULT 1,
  last_used timestamp with time zone NOT NULL DEFAULT now(),
  total_time_spent_ms bigint DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_role text,
  device_type text,
  UNIQUE(user_id, feature_name)
);

-- System health monitoring
CREATE TABLE IF NOT EXISTS public.system_health_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metric_unit text,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  service_name text,
  environment text DEFAULT 'production',
  alert_threshold numeric,
  is_critical boolean DEFAULT false
);

-- User feedback and satisfaction tracking
CREATE TABLE IF NOT EXISTS public.user_satisfaction (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  page_url text,
  satisfaction_score integer CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
  feedback_text text,
  category text, -- performance, usability, design, functionality
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  resolved boolean DEFAULT false,
  resolution_notes text
);

-- Enable RLS on all new tables
ALTER TABLE public.performance_metrics_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_satisfaction ENABLE ROW LEVEL SECURITY;

-- RLS Policies for performance metrics
CREATE POLICY "Users can view their own performance metrics"
ON public.performance_metrics_log
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "System can insert performance metrics"
ON public.performance_metrics_log
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all performance metrics"
ON public.performance_metrics_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for user interactions
CREATE POLICY "Users can view their own interactions"
ON public.user_interactions
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "System can insert interactions"
ON public.user_interactions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all interactions"
ON public.user_interactions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for feature usage
CREATE POLICY "Users can view their own feature usage"
ON public.feature_usage
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own feature usage"
ON public.feature_usage
FOR ALL
TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL)
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Admins can view all feature usage"
ON public.feature_usage
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for system health
CREATE POLICY "Admins can manage system health metrics"
ON public.system_health_metrics
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System can insert health metrics"
ON public.system_health_metrics
FOR INSERT
WITH CHECK (true);

-- RLS Policies for user satisfaction
CREATE POLICY "Users can manage their own satisfaction feedback"
ON public.user_satisfaction
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all satisfaction feedback"
ON public.user_satisfaction
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Function to track feature usage
CREATE OR REPLACE FUNCTION public.track_feature_usage(
  p_user_id uuid,
  p_feature_name text,
  p_time_spent_ms integer DEFAULT 0,
  p_user_role text DEFAULT NULL,
  p_device_type text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.feature_usage (
    user_id, 
    feature_name, 
    total_time_spent_ms,
    user_role,
    device_type
  ) VALUES (
    p_user_id, 
    p_feature_name, 
    p_time_spent_ms,
    p_user_role,
    p_device_type
  )
  ON CONFLICT (user_id, feature_name) 
  DO UPDATE SET
    usage_count = feature_usage.usage_count + 1,
    last_used = now(),
    total_time_spent_ms = feature_usage.total_time_spent_ms + p_time_spent_ms;
END;
$$;

-- Function to log performance metrics
CREATE OR REPLACE FUNCTION public.log_performance_metric(
  p_user_id uuid DEFAULT NULL,
  p_session_id text DEFAULT NULL,
  p_page_url text DEFAULT NULL,
  p_load_time_ms integer DEFAULT NULL,
  p_fcp_ms integer DEFAULT NULL,
  p_lcp_ms integer DEFAULT NULL,
  p_cls numeric DEFAULT NULL,
  p_fid_ms integer DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_device_type text DEFAULT NULL,
  p_connection_type text DEFAULT NULL,
  p_bundle_size_kb integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_metric_id uuid;
BEGIN
  INSERT INTO public.performance_metrics_log (
    user_id,
    session_id,
    page_url,
    load_time_ms,
    first_contentful_paint_ms,
    largest_contentful_paint_ms,
    cumulative_layout_shift,
    first_input_delay_ms,
    user_agent,
    device_type,
    connection_type,
    bundle_size_kb
  ) VALUES (
    p_user_id,
    p_session_id,
    p_page_url,
    p_load_time_ms,
    p_fcp_ms,
    p_lcp_ms,
    p_cls,
    p_fid_ms,
    p_user_agent,
    p_device_type,
    p_connection_type,
    p_bundle_size_kb
  ) RETURNING id INTO v_metric_id;
  
  RETURN v_metric_id;
END;
$$;

-- Function to get performance insights
CREATE OR REPLACE FUNCTION public.get_performance_insights(p_days integer DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_insights jsonb;
  v_avg_load_time numeric;
  v_avg_fcp numeric;
  v_avg_lcp numeric;
  v_slow_pages_count integer;
  v_total_page_views integer;
BEGIN
  -- Calculate average metrics
  SELECT 
    AVG(load_time_ms),
    AVG(first_contentful_paint_ms),
    AVG(largest_contentful_paint_ms),
    COUNT(*) FILTER (WHERE load_time_ms > 3000),
    COUNT(*)
  INTO 
    v_avg_load_time,
    v_avg_fcp,
    v_avg_lcp,
    v_slow_pages_count,
    v_total_page_views
  FROM public.performance_metrics_log
  WHERE timestamp > now() - interval '1 day' * p_days;
  
  v_insights := jsonb_build_object(
    'period_days', p_days,
    'average_load_time_ms', COALESCE(v_avg_load_time, 0),
    'average_fcp_ms', COALESCE(v_avg_fcp, 0),
    'average_lcp_ms', COALESCE(v_avg_lcp, 0),
    'slow_pages_count', COALESCE(v_slow_pages_count, 0),
    'total_page_views', COALESCE(v_total_page_views, 0),
    'slow_pages_percentage', CASE 
      WHEN v_total_page_views > 0 THEN ROUND((v_slow_pages_count::numeric / v_total_page_views) * 100, 2)
      ELSE 0
    END,
    'performance_score', CASE
      WHEN v_avg_load_time IS NULL THEN 100
      WHEN v_avg_load_time < 1000 THEN 100
      WHEN v_avg_load_time < 2000 THEN 90
      WHEN v_avg_load_time < 3000 THEN 70
      WHEN v_avg_load_time < 5000 THEN 50
      ELSE 30
    END
  );
  
  RETURN v_insights;
END;
$$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_performance_metrics_log_timestamp ON public.performance_metrics_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_log_user_id ON public.performance_metrics_log(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_log_page_url ON public.performance_metrics_log(page_url);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON public.user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_timestamp ON public.user_interactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON public.user_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_id ON public.feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature_name ON public.feature_usage(feature_name);
CREATE INDEX IF NOT EXISTS idx_system_health_timestamp ON public.system_health_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_health_critical ON public.system_health_metrics(is_critical) WHERE is_critical = true;
CREATE INDEX IF NOT EXISTS idx_user_satisfaction_user_id ON public.user_satisfaction(user_id);
CREATE INDEX IF NOT EXISTS idx_user_satisfaction_timestamp ON public.user_satisfaction(timestamp);