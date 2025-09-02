-- Create edge functions for job assignment workflow and communication system

-- First, let's ensure we have the necessary tables for the workflow
CREATE TABLE IF NOT EXISTS public.job_assignment_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  action TEXT NOT NULL CHECK (action IN ('accept', 'decline')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create message queue for outbound communications
CREATE TABLE IF NOT EXISTS public.message_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
  template_code TEXT NOT NULL,
  recipient_id UUID,
  recipient_phone TEXT,
  recipient_email TEXT,
  payload_json JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'expired')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  external_id TEXT,
  retries INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reminder queue for unanswered offers
CREATE TABLE IF NOT EXISTS public.reminder_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('2hour', 'expiry')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit log for job assignment actions
CREATE TABLE IF NOT EXISTS public.job_assignment_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL,
  action TEXT NOT NULL,
  actor_id UUID,
  actor_type TEXT, -- 'admin', 'contractor', 'system'
  old_status TEXT,
  new_status TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.job_assignment_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_assignment_audit ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "System can manage assignment tokens" ON public.job_assignment_tokens
  FOR ALL USING (true);

CREATE POLICY "System can manage message queue" ON public.message_queue
  FOR ALL USING (true);

CREATE POLICY "System can manage reminder queue" ON public.reminder_queue
  FOR ALL USING (true);

CREATE POLICY "Admins can view audit logs" ON public.job_assignment_audit
  FOR SELECT USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System can create audit logs" ON public.job_assignment_audit
  FOR INSERT WITH CHECK (true);

-- Create function to generate secure assignment tokens
CREATE OR REPLACE FUNCTION public.generate_assignment_token(
  p_assignment_id UUID,
  p_action TEXT,
  p_expires_hours INTEGER DEFAULT 24
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Generate a secure random token
  v_token := encode(gen_random_bytes(32), 'base64url');
  
  -- Insert token record
  INSERT INTO public.job_assignment_tokens (
    assignment_id,
    token,
    action,
    expires_at
  ) VALUES (
    p_assignment_id,
    v_token,
    p_action,
    now() + (p_expires_hours || ' hours')::INTERVAL
  );
  
  RETURN v_token;
END;
$$;

-- Create function to validate and use assignment token
CREATE OR REPLACE FUNCTION public.use_assignment_token(
  p_token TEXT,
  p_action TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_token_record RECORD;
  v_assignment_record RECORD;
  v_result JSONB;
BEGIN
  -- Find and validate token
  SELECT * INTO v_token_record
  FROM public.job_assignment_tokens
  WHERE token = p_token
    AND action = p_action
    AND is_active = true
    AND used_at IS NULL
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid, expired, or already used token'
    );
  END IF;
  
  -- Get assignment details
  SELECT * INTO v_assignment_record
  FROM public.subcontractor_job_assignments
  WHERE id = v_token_record.assignment_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Assignment not found'
    );
  END IF;
  
  -- Mark token as used
  UPDATE public.job_assignment_tokens
  SET used_at = now(), is_active = false
  WHERE id = v_token_record.id;
  
  -- Update assignment status
  UPDATE public.subcontractor_job_assignments
  SET 
    status = CASE WHEN p_action = 'accept' THEN 'accepted' ELSE 'declined' END,
    acceptance_at = now()
  WHERE id = v_assignment_record.id;
  
  -- Update job status if accepted
  IF p_action = 'accept' THEN
    UPDATE public.orders
    SET order_status = 'assigned'
    WHERE id = v_assignment_record.booking_id;
  END IF;
  
  -- Create audit log
  INSERT INTO public.job_assignment_audit (
    assignment_id,
    action,
    actor_type,
    old_status,
    new_status,
    metadata
  ) VALUES (
    v_assignment_record.id,
    p_action || '_via_token',
    'contractor',
    v_assignment_record.status,
    CASE WHEN p_action = 'accept' THEN 'accepted' ELSE 'declined' END,
    jsonb_build_object('token_id', v_token_record.id)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'assignment_id', v_assignment_record.id,
    'new_status', CASE WHEN p_action = 'accept' THEN 'accepted' ELSE 'declined' END
  );
END;
$$;

-- Create function to queue job assignment notification
CREATE OR REPLACE FUNCTION public.queue_job_assignment_notification(
  p_assignment_id UUID,
  p_subcontractor_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_subcontractor RECORD;
  v_assignment RECORD;
  v_job RECORD;
  v_accept_token TEXT;
  v_decline_token TEXT;
  v_payload JSONB;
BEGIN
  -- Get subcontractor details
  SELECT * INTO v_subcontractor
  FROM public.subcontractors
  WHERE id = p_subcontractor_id;
  
  -- Get assignment details
  SELECT * INTO v_assignment
  FROM public.subcontractor_job_assignments sja
  JOIN public.orders o ON o.id = sja.booking_id
  WHERE sja.id = p_assignment_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Assignment or subcontractor not found');
  END IF;
  
  -- Generate secure tokens
  v_accept_token := public.generate_assignment_token(p_assignment_id, 'accept', 24);
  v_decline_token := public.generate_assignment_token(p_assignment_id, 'decline', 24);
  
  -- Prepare payload
  v_payload := jsonb_build_object(
    'assignment_id', p_assignment_id,
    'subcontractor_name', v_subcontractor.full_name,
    'job_details', v_assignment,
    'accept_token', v_accept_token,
    'decline_token', v_decline_token,
    'expires_at', (now() + INTERVAL '24 hours')::TEXT
  );
  
  -- Queue SMS notification
  IF v_subcontractor.phone IS NOT NULL THEN
    INSERT INTO public.message_queue (
      channel, template_code, recipient_id, recipient_phone, payload_json
    ) VALUES (
      'sms', 'JOB_ASSIGNED', p_subcontractor_id, v_subcontractor.phone, v_payload
    );
  END IF;
  
  -- Queue Email notification  
  IF v_subcontractor.email IS NOT NULL THEN
    INSERT INTO public.message_queue (
      channel, template_code, recipient_id, recipient_email, payload_json
    ) VALUES (
      'email', 'JOB_ASSIGNED', p_subcontractor_id, v_subcontractor.email, v_payload
    );
  END IF;
  
  -- Schedule 2-hour reminder
  INSERT INTO public.reminder_queue (
    assignment_id, reminder_type, scheduled_for
  ) VALUES (
    p_assignment_id, '2hour', now() + INTERVAL '2 hours'
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Notifications queued successfully');
END;
$$;

-- Create function to auto-create payroll records from approved timesheets
CREATE OR REPLACE FUNCTION public.create_payroll_record_from_timesheet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_period RECORD;
  v_record_id UUID;
BEGIN
  -- Only process when timesheet is approved
  IF NEW.status != 'approved' OR OLD.status = 'approved' THEN
    RETURN NEW;
  END IF;
  
  -- Find current open payroll period
  SELECT * INTO v_current_period
  FROM public.payroll_periods
  WHERE status = 'open'
    AND NEW.created_at::DATE BETWEEN period_start AND period_end
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'No open payroll period found for timesheet %', NEW.id;
    RETURN NEW;
  END IF;
  
  -- Create payroll record
  INSERT INTO public.payroll_records (
    payroll_period_id,
    contractor_id,
    timesheet_id,
    pay_type,
    units,
    rate,
    pay_calc,
    status,
    memo
  ) VALUES (
    v_current_period.id,
    NEW.contractor_id,
    NEW.id,
    'hourly',
    NEW.hours_calc,
    (SELECT hourly_rate FROM public.subcontractors WHERE id = NEW.contractor_id),
    NEW.hours_calc * (SELECT hourly_rate FROM public.subcontractors WHERE id = NEW.contractor_id),
    'pending',
    'Auto-generated from approved timesheet'
  ) RETURNING id INTO v_record_id;
  
  -- Log the creation
  INSERT INTO public.job_assignment_audit (
    assignment_id,
    action,
    actor_type,
    metadata
  ) VALUES (
    NEW.id::UUID,
    'payroll_record_created',
    'system',
    jsonb_build_object('payroll_record_id', v_record_id, 'timesheet_id', NEW.id)
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic payroll record creation
DROP TRIGGER IF EXISTS trigger_create_payroll_from_timesheet ON public.timesheets;
CREATE TRIGGER trigger_create_payroll_from_timesheet
  AFTER UPDATE ON public.timesheets
  FOR EACH ROW
  EXECUTE FUNCTION public.create_payroll_record_from_timesheet();

-- Create function to prevent edits when payroll period is locked
CREATE OR REPLACE FUNCTION public.check_payroll_period_locked()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_period_locked BOOLEAN := false;
BEGIN
  -- Check if any payroll period covering this timesheet is locked
  SELECT EXISTS(
    SELECT 1 FROM public.payroll_periods pp
    WHERE pp.status = 'locked'
      AND NEW.created_at::DATE BETWEEN pp.period_start AND pp.period_end
  ) INTO v_period_locked;
  
  IF v_period_locked THEN
    RAISE EXCEPTION 'Cannot modify timesheet: payroll period is locked';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to enforce payroll period locks
DROP TRIGGER IF EXISTS trigger_check_payroll_locked ON public.timesheets;
CREATE TRIGGER trigger_check_payroll_locked
  BEFORE UPDATE ON public.timesheets
  FOR EACH ROW
  EXECUTE FUNCTION public.check_payroll_period_locked();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_assignment_tokens_token ON public.job_assignment_tokens(token);
CREATE INDEX IF NOT EXISTS idx_job_assignment_tokens_assignment ON public.job_assignment_tokens(assignment_id);
CREATE INDEX IF NOT EXISTS idx_message_queue_status_scheduled ON public.message_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_reminder_queue_scheduled ON public.reminder_queue(scheduled_for, status);
CREATE INDEX IF NOT EXISTS idx_audit_assignment_created ON public.job_assignment_audit(assignment_id, created_at);

-- Add updated_at trigger to message_queue
CREATE TRIGGER set_message_queue_updated_at
  BEFORE UPDATE ON public.message_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();