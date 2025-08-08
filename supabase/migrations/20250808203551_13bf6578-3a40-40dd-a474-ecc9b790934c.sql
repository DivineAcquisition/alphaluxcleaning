-- Create automation_rules table
CREATE TABLE public.automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'notification')),
  trigger_event TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  trigger_conditions JSONB DEFAULT '{}',
  action_config JSONB DEFAULT '{}',
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMP WITH TIME ZONE
);

-- Create automation_executions table for tracking runs
CREATE TABLE public.automation_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_rule_id UUID NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  recipient_email TEXT,
  recipient_phone TEXT,
  message_content TEXT,
  error_message TEXT,
  execution_data JSONB DEFAULT '{}'
);

-- Create indexes
CREATE INDEX idx_automation_rules_enabled ON public.automation_rules(enabled);
CREATE INDEX idx_automation_rules_type ON public.automation_rules(type);
CREATE INDEX idx_automation_executions_rule_id ON public.automation_executions(automation_rule_id);
CREATE INDEX idx_automation_executions_status ON public.automation_executions(status);
CREATE INDEX idx_automation_executions_executed_at ON public.automation_executions(executed_at);

-- Enable RLS
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for automation_rules
CREATE POLICY "Admins can manage automation rules" 
ON public.automation_rules 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for automation_executions
CREATE POLICY "Admins can view automation executions" 
ON public.automation_executions 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System can insert automation executions" 
ON public.automation_executions 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate success rate
CREATE OR REPLACE FUNCTION public.get_automation_success_rate(rule_id UUID)
RETURNS NUMERIC
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    CASE 
      WHEN (success_count + failure_count) = 0 THEN 0
      ELSE ROUND((success_count::NUMERIC / (success_count + failure_count)) * 100, 2)
    END
  FROM public.automation_rules
  WHERE id = rule_id;
$$;