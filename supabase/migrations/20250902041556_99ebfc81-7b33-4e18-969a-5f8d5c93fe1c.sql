-- Create RLS policies and core functions for contractor management system

-- Enable RLS on all new tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.magic_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shortlinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comms_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_webhooks_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbound_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients
CREATE POLICY "Admins can manage all clients" ON public.clients
FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for jobs
CREATE POLICY "Admins can manage all jobs" ON public.jobs
FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Contractors can view assigned jobs" ON public.jobs
FOR SELECT USING (
  id IN (
    SELECT ja.job_id FROM public.job_assignments ja 
    WHERE ja.contractor_id IN (
      SELECT s.id FROM public.subcontractors s WHERE s.user_id = auth.uid()
    )
  )
);

-- RLS Policies for job_assignments
CREATE POLICY "Admins can manage all job assignments" ON public.job_assignments
FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Contractors can view their assignments" ON public.job_assignments
FOR SELECT USING (
  contractor_id IN (
    SELECT s.id FROM public.subcontractors s WHERE s.user_id = auth.uid()
  )
);

CREATE POLICY "Contractors can update their assignment responses" ON public.job_assignments
FOR UPDATE USING (
  contractor_id IN (
    SELECT s.id FROM public.subcontractors s WHERE s.user_id = auth.uid()
  )
) WITH CHECK (
  contractor_id IN (
    SELECT s.id FROM public.subcontractors s WHERE s.user_id = auth.uid()
  )
);

-- RLS Policies for timesheets
CREATE POLICY "Admins can manage all timesheets" ON public.timesheets
FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Contractors can manage their timesheets" ON public.timesheets
FOR ALL USING (
  contractor_id IN (
    SELECT s.id FROM public.subcontractors s WHERE s.user_id = auth.uid()
  )
) WITH CHECK (
  contractor_id IN (
    SELECT s.id FROM public.subcontractors s WHERE s.user_id = auth.uid()
  )
);

-- RLS Policies for payroll_periods
CREATE POLICY "Admins can manage payroll periods" ON public.payroll_periods
FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Contractors can view payroll periods" ON public.payroll_periods
FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for payroll_records
CREATE POLICY "Admins can manage all payroll records" ON public.payroll_records
FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Contractors can view their payroll records" ON public.payroll_records
FOR SELECT USING (
  contractor_id IN (
    SELECT s.id FROM public.subcontractors s WHERE s.user_id = auth.uid()
  )
);

-- RLS Policies for payouts
CREATE POLICY "Admins can manage all payouts" ON public.payouts
FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Contractors can view their payouts" ON public.payouts
FOR SELECT USING (
  payroll_record_id IN (
    SELECT pr.id FROM public.payroll_records pr
    WHERE pr.contractor_id IN (
      SELECT s.id FROM public.subcontractors s WHERE s.user_id = auth.uid()
    )
  )
);

-- RLS Policies for magic_tokens
CREATE POLICY "System can manage magic tokens" ON public.magic_tokens
FOR ALL USING (true);

-- RLS Policies for shortlinks
CREATE POLICY "System can manage shortlinks" ON public.shortlinks
FOR ALL USING (true);

-- RLS Policies for comms_preferences
CREATE POLICY "Admins can manage all comms preferences" ON public.comms_preferences
FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Contractors can manage their comms preferences" ON public.comms_preferences
FOR ALL USING (
  contractor_id IN (
    SELECT s.id FROM public.subcontractors s WHERE s.user_id = auth.uid()
  )
) WITH CHECK (
  contractor_id IN (
    SELECT s.id FROM public.subcontractors s WHERE s.user_id = auth.uid()
  )
);

-- RLS Policies for contractor_message_templates
CREATE POLICY "Admins can manage message templates" ON public.contractor_message_templates
FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for contractor_messages
CREATE POLICY "Admins can manage all contractor messages" ON public.contractor_messages
FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Contractors can view their messages" ON public.contractor_messages
FOR SELECT USING (
  to_contractor_id IN (
    SELECT s.id FROM public.subcontractors s WHERE s.user_id = auth.uid()
  )
);

-- RLS Policies for delivery_logs
CREATE POLICY "Admins can view delivery logs" ON public.delivery_logs
FOR SELECT USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for contractor_webhooks_outbox
CREATE POLICY "System can manage webhook outbox" ON public.contractor_webhooks_outbox
FOR ALL USING (true);

-- RLS Policies for inbound_events
CREATE POLICY "System can manage inbound events" ON public.inbound_events
FOR ALL USING (true);

-- Create function to generate secure tokens
CREATE OR REPLACE FUNCTION public.generate_magic_token(
  p_entity TEXT,
  p_entity_id UUID,
  p_action TEXT,
  p_expires_hours INTEGER DEFAULT 24
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_token_id UUID;
  v_token_hmac TEXT;
BEGIN
  -- Generate a secure token
  v_token_hmac := encode(digest(gen_random_uuid()::text || now()::text, 'sha256'), 'hex');
  
  -- Insert the token record
  INSERT INTO public.magic_tokens (
    token_hmac,
    entity,
    entity_id,
    action,
    expires_at
  ) VALUES (
    v_token_hmac,
    p_entity,
    p_entity_id,
    p_action,
    now() + (p_expires_hours || ' hours')::interval
  ) RETURNING id INTO v_token_id;
  
  RETURN v_token_id;
END;
$$;

-- Create function to validate and use tokens
CREATE OR REPLACE FUNCTION public.validate_magic_token(
  p_token_hmac TEXT,
  p_entity TEXT,
  p_entity_id UUID,
  p_action TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_token_record RECORD;
BEGIN
  -- Find the token
  SELECT * INTO v_token_record
  FROM public.magic_tokens
  WHERE token_hmac = p_token_hmac
    AND entity = p_entity
    AND entity_id = p_entity_id
    AND action = p_action
    AND expires_at > now()
    AND used_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Mark token as used
  UPDATE public.magic_tokens
  SET used_at = now()
  WHERE id = v_token_record.id;
  
  RETURN TRUE;
END;
$$;

-- Create function to calculate contractor payroll
CREATE OR REPLACE FUNCTION public.calculate_contractor_payroll(
  p_contractor_id UUID,
  p_period_start DATE,
  p_period_end DATE
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_contractor RECORD;
  v_timesheet RECORD;
  v_payroll_period_id UUID;
  v_total_hours NUMERIC := 0;
  v_total_pay NUMERIC := 0;
  v_results JSONB := '[]'::jsonb;
BEGIN
  -- Get contractor details
  SELECT * INTO v_contractor
  FROM public.subcontractors
  WHERE id = p_contractor_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Contractor not found');
  END IF;
  
  -- Get or create payroll period
  SELECT id INTO v_payroll_period_id
  FROM public.payroll_periods
  WHERE period_start = p_period_start AND period_end = p_period_end;
  
  IF NOT FOUND THEN
    INSERT INTO public.payroll_periods (period_start, period_end)
    VALUES (p_period_start, p_period_end)
    RETURNING id INTO v_payroll_period_id;
  END IF;
  
  -- Process approved timesheets for the period
  FOR v_timesheet IN
    SELECT t.*, j.pricing_model, j.price_quote, ja.pay_override_type, ja.pay_override_value
    FROM public.timesheets t
    JOIN public.jobs j ON t.job_id = j.id
    LEFT JOIN public.job_assignments ja ON ja.job_id = j.id AND ja.contractor_id = t.contractor_id
    WHERE t.contractor_id = p_contractor_id
      AND t.status = 'approved'
      AND t.start_time::date BETWEEN p_period_start AND p_period_end
      AND NOT EXISTS (
        SELECT 1 FROM public.payroll_records pr
        WHERE pr.timesheet_id = t.id
      )
  LOOP
    -- Calculate pay based on rate type and job pricing model
    DECLARE
      v_pay_type pay_type;
      v_rate NUMERIC;
      v_units NUMERIC;
      v_pay_amount NUMERIC;
    BEGIN
      -- Determine pay calculation
      IF v_timesheet.pay_override_type IS NOT NULL THEN
        v_pay_type := v_timesheet.pay_override_type;
        v_rate := v_timesheet.pay_override_value;
      ELSE
        v_pay_type := v_contractor.base_rate_type;
        v_rate := v_contractor.base_rate_value;
      END IF;
      
      -- Calculate units and pay based on type
      IF v_pay_type = 'hourly' THEN
        v_units := v_timesheet.hours_calc;
        v_pay_amount := v_units * v_rate;
      ELSIF v_pay_type = 'flat' THEN
        v_units := 1;
        v_rate := COALESCE(v_timesheet.price_quote, v_rate);
        v_pay_amount := v_rate;
      ELSE -- commission
        v_units := 1;
        v_pay_amount := (COALESCE(v_timesheet.price_quote, 0) * v_rate / 100);
      END IF;
      
      -- Insert payroll record
      INSERT INTO public.payroll_records (
        payroll_period_id,
        contractor_id,
        job_id,
        timesheet_id,
        pay_type,
        units,
        rate,
        status
      ) VALUES (
        v_payroll_period_id,
        p_contractor_id,
        v_timesheet.job_id,
        v_timesheet.id,
        v_pay_type,
        v_units,
        v_rate,
        'pending'
      );
      
      v_total_hours := v_total_hours + v_timesheet.hours_calc;
      v_total_pay := v_total_pay + v_pay_amount;
      
      v_results := v_results || jsonb_build_object(
        'timesheet_id', v_timesheet.id,
        'hours', v_timesheet.hours_calc,
        'pay_type', v_pay_type,
        'rate', v_rate,
        'units', v_units,
        'amount', v_pay_amount
      );
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'contractor_id', p_contractor_id,
    'period_start', p_period_start,
    'period_end', p_period_end,
    'total_hours', v_total_hours,
    'total_pay', v_total_pay,
    'records', v_results
  );
END;
$$;

-- Insert default message templates
INSERT INTO public.contractor_message_templates (code, channel, subject, body_text, active) VALUES
('JOB_ASSIGNED', 'sms', NULL, 'Hi {{contractor.first_name}}! You have a new job: {{job.service_type}} on {{job.start_date}} at {{job.start_time}}. Location: {{job.location}}. Accept: {{shortlink_accept}} Decline: {{shortlink_decline}}', true),
('JOB_ASSIGNED', 'email', 'New Job Assignment - {{job.service_type}}', 'Hi {{contractor.first_name}},

You have been assigned a new job:

Service: {{job.service_type}}
Date: {{job.start_date}}
Time: {{job.start_time}}
Location: {{job.location}}
Instructions: {{job.instructions}}

Please respond within 2 hours:
Accept: {{shortlink_accept}}
Decline: {{shortlink_decline}}

Thank you!', true),
('REMINDER_2H', 'sms', NULL, 'Reminder: Please respond to your job assignment for {{job.service_type}} on {{job.start_date}}. Accept: {{shortlink_accept}} Decline: {{shortlink_decline}}', true),
('TIMESHEET_REJECTED', 'sms', NULL, 'Your timesheet for {{job.service_type}} on {{timesheet.date}} was rejected. Reason: {{rejection.reason}}. Please resubmit with corrections.', true),
('PAYOUT_SENT', 'sms', NULL, 'Payment of ${{payout.amount}} has been sent for period {{period.start}} - {{period.end}}. Reference: {{payout.reference}}', true);

-- Create function to queue contractor notifications
CREATE OR REPLACE FUNCTION public.queue_contractor_message(
  p_contractor_id UUID,
  p_template_code TEXT,
  p_channel message_channel,
  p_payload_json JSONB DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_message_id UUID;
  v_prefs RECORD;
BEGIN
  -- Get contractor communication preferences
  SELECT * INTO v_prefs
  FROM public.comms_preferences
  WHERE contractor_id = p_contractor_id;
  
  -- Check if channel is allowed
  IF v_prefs IS NULL OR 
     (p_channel = 'sms' AND NOT v_prefs.allow_sms) OR
     (p_channel = 'email' AND NOT v_prefs.allow_email) THEN
    RETURN NULL;
  END IF;
  
  -- Insert message
  INSERT INTO public.contractor_messages (
    to_contractor_id,
    channel,
    template_code,
    payload_json,
    status
  ) VALUES (
    p_contractor_id,
    p_channel,
    p_template_code,
    p_payload_json,
    'queued'
  ) RETURNING id INTO v_message_id;
  
  RETURN v_message_id;
END;
$$;