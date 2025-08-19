-- Create enhanced automation rules and notification triggers

-- First, let's add some missing columns to existing tables for better tracking
ALTER TABLE notification_queue ADD COLUMN IF NOT EXISTS trigger_source TEXT;
ALTER TABLE notification_queue ADD COLUMN IF NOT EXISTS automation_rule_id UUID;

-- Create notification templates table for reusable message templates
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  template_type TEXT NOT NULL, -- 'sms', 'email', 'in_app'
  subject_template TEXT,
  body_template TEXT NOT NULL,
  trigger_events TEXT[] NOT NULL, -- Array of events this template applies to
  is_active BOOLEAN DEFAULT true,
  variables JSONB DEFAULT '{}', -- Available template variables
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create automated notification triggers table
CREATE TABLE IF NOT EXISTS automated_notification_triggers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT NOT NULL, -- 'order_status_changed', 'payment_confirmed', etc.
  trigger_conditions JSONB DEFAULT '{}', -- Conditions that must be met
  is_active BOOLEAN DEFAULT true,
  template_id UUID REFERENCES notification_templates(id),
  delivery_methods TEXT[] NOT NULL DEFAULT '{"in_app"}', -- sms, email, in_app
  delay_minutes INTEGER DEFAULT 0, -- Delay before sending
  priority INTEGER DEFAULT 5,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create trigger execution log
CREATE TABLE IF NOT EXISTS trigger_execution_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_id UUID REFERENCES automated_notification_triggers(id),
  entity_type TEXT NOT NULL, -- 'order', 'booking', 'application'
  entity_id UUID NOT NULL,
  execution_status TEXT DEFAULT 'pending', -- pending, success, failed
  execution_data JSONB DEFAULT '{}',
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE automated_notification_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trigger_execution_log ENABLE ROW LEVEL SECURITY;

-- Templates - only admins can manage
CREATE POLICY "Admins can manage notification templates" ON notification_templates
FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Triggers - only admins can manage
CREATE POLICY "Admins can manage automated triggers" ON automated_notification_triggers
FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Execution log - admins can view all, users can view their own
CREATE POLICY "Admins can view trigger execution log" ON trigger_execution_log
FOR SELECT USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Function to process automated triggers
CREATE OR REPLACE FUNCTION process_automated_triggers(
  p_event_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_entity_data JSONB DEFAULT '{}'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  trigger_record RECORD;
  template_record RECORD;
  customer_id UUID;
  notification_data JSONB;
  result_data JSONB := '{"notifications_queued": 0, "errors": []}'::jsonb;
  error_messages TEXT[] := '{}';
BEGIN
  -- Find active triggers for this event
  FOR trigger_record IN 
    SELECT * FROM automated_notification_triggers 
    WHERE trigger_event = p_event_type 
    AND is_active = true
  LOOP
    BEGIN
      -- Get template
      SELECT * INTO template_record
      FROM notification_templates 
      WHERE id = trigger_record.template_id 
      AND is_active = true;
      
      IF NOT FOUND THEN
        error_messages := array_append(error_messages, 'Template not found for trigger: ' || trigger_record.name);
        CONTINUE;
      END IF;
      
      -- Extract customer_id based on entity type
      CASE p_entity_type
        WHEN 'order' THEN
          SELECT user_id INTO customer_id FROM orders WHERE id = p_entity_id;
        WHEN 'booking' THEN
          -- Get customer from booking - assuming we can link via order
          SELECT o.user_id INTO customer_id 
          FROM bookings b 
          JOIN orders o ON o.id = b.order_id 
          WHERE b.id = p_entity_id;
        WHEN 'application' THEN
          -- For applications, we might notify admins instead
          customer_id := NULL;
        ELSE
          customer_id := NULL;
      END CASE;
      
      -- Queue notifications for each delivery method
      FOREACH delivery_method IN ARRAY trigger_record.delivery_methods
      LOOP
        IF customer_id IS NOT NULL OR delivery_method = 'admin' THEN
          -- Render template with entity data
          notification_data := jsonb_build_object(
            'entity_type', p_entity_type,
            'entity_id', p_entity_id,
            'entity_data', p_entity_data,
            'template_variables', template_record.variables
          );
          
          -- Insert into notification queue
          INSERT INTO notification_queue (
            customer_id,
            notification_type,
            delivery_method,
            subject,
            message,
            scheduled_for,
            template_data,
            priority,
            trigger_source,
            automation_rule_id
          ) VALUES (
            customer_id,
            p_event_type,
            delivery_method,
            template_record.subject_template,
            template_record.body_template,
            now() + (trigger_record.delay_minutes || ' minutes')::interval,
            notification_data,
            trigger_record.priority,
            'automated_trigger',
            trigger_record.id
          );
          
          -- Update result
          result_data := jsonb_set(
            result_data,
            '{notifications_queued}',
            to_jsonb((result_data->>'notifications_queued')::int + 1)
          );
        END IF;
      END LOOP;
      
      -- Log successful execution
      INSERT INTO trigger_execution_log (
        trigger_id,
        entity_type,
        entity_id,
        execution_status,
        execution_data
      ) VALUES (
        trigger_record.id,
        p_entity_type,
        p_entity_id,
        'success',
        notification_data
      );
      
    EXCEPTION WHEN OTHERS THEN
      -- Log failed execution
      INSERT INTO trigger_execution_log (
        trigger_id,
        entity_type,
        entity_id,
        execution_status,
        execution_data,
        error_message
      ) VALUES (
        trigger_record.id,
        p_entity_type,
        p_entity_id,
        'failed',
        p_entity_data,
        SQLERRM
      );
      
      error_messages := array_append(error_messages, 'Trigger ' || trigger_record.name || ': ' || SQLERRM);
    END;
  END LOOP;
  
  -- Add errors to result
  IF array_length(error_messages, 1) > 0 THEN
    result_data := jsonb_set(result_data, '{errors}', to_jsonb(error_messages));
  END IF;
  
  RETURN result_data;
END;
$$;

-- Create database triggers for orders table
CREATE OR REPLACE FUNCTION notify_order_changes() RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Order status changed
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM process_automated_triggers(
      'order_status_changed',
      'order',
      NEW.id,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'customer_email', NEW.customer_email,
        'customer_name', NEW.customer_name,
        'amount', NEW.amount,
        'service_date', NEW.scheduled_date
      )
    );
  END IF;
  
  -- New order created
  IF TG_OP = 'INSERT' THEN
    PERFORM process_automated_triggers(
      'order_created',
      'order',
      NEW.id,
      jsonb_build_object(
        'status', NEW.status,
        'customer_email', NEW.customer_email,
        'customer_name', NEW.customer_name,
        'amount', NEW.amount,
        'service_date', NEW.scheduled_date
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create database triggers for bookings table
CREATE OR REPLACE FUNCTION notify_booking_changes() RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Booking status changed
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM process_automated_triggers(
      'booking_status_changed',
      'booking',
      NEW.id,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'customer_email', NEW.customer_email,
        'customer_name', NEW.customer_name,
        'service_date', NEW.service_date,
        'service_time', NEW.service_time
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create database triggers for subcontractor applications
CREATE OR REPLACE FUNCTION notify_application_changes() RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Application status changed
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM process_automated_triggers(
      'application_status_changed',
      'application',
      NEW.id,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'applicant_email', NEW.email,
        'applicant_name', NEW.full_name
      )
    );
  END IF;
  
  -- New application submitted
  IF TG_OP = 'INSERT' THEN
    PERFORM process_automated_triggers(
      'application_submitted',
      'application',
      NEW.id,
      jsonb_build_object(
        'status', NEW.status,
        'applicant_email', NEW.email,
        'applicant_name', NEW.full_name
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS order_status_notification_trigger ON orders;
DROP TRIGGER IF EXISTS booking_status_notification_trigger ON bookings;
DROP TRIGGER IF EXISTS application_status_notification_trigger ON subcontractor_applications;

-- Create the actual triggers
CREATE TRIGGER order_status_notification_trigger
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_changes();

CREATE TRIGGER booking_status_notification_trigger
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_changes();

CREATE TRIGGER application_status_notification_trigger
  AFTER INSERT OR UPDATE ON subcontractor_applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_application_changes();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_templates_trigger_events ON notification_templates USING gin(trigger_events);
CREATE INDEX IF NOT EXISTS idx_automated_triggers_event ON automated_notification_triggers(trigger_event);
CREATE INDEX IF NOT EXISTS idx_trigger_execution_log_entity ON trigger_execution_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_trigger_source ON notification_queue(trigger_source);