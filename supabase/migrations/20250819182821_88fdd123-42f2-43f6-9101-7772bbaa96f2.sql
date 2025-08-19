-- Create automated notification triggers table
CREATE TABLE IF NOT EXISTS automated_notification_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT NOT NULL,
  template_id UUID REFERENCES notification_templates(id),
  delivery_methods TEXT[] NOT NULL DEFAULT ARRAY['sms'],
  conditions JSONB DEFAULT '{}',
  delay_minutes INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE automated_notification_triggers ENABLE ROW LEVEL SECURITY;

-- Create policies for automated triggers
CREATE POLICY "Admins can manage automated triggers"
ON automated_notification_triggers FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));