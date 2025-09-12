-- Fix the process_automated_triggers function to use correct column names and add error handling
CREATE OR REPLACE FUNCTION process_automated_triggers(
  p_event_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_entity_data JSONB DEFAULT '{}'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  trigger_record RECORD;
  template_record RECORD;
  customer_id UUID;
  notification_data JSONB;
  result_data JSONB := '{"notifications_queued": 0, "errors": []}'::jsonb;
  error_messages TEXT[] := '{}';
  delivery_method TEXT;
  table_exists BOOLEAN;
BEGIN
  -- Check if automation tables exist to prevent errors during development/migration
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'automated_notification_triggers'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    -- Return empty result if automation tables don't exist yet
    RETURN '{"notifications_queued": 0, "errors": ["Automation system not fully configured"], "skipped": true}'::jsonb;
  END IF;

  -- Find active triggers for this event using correct column name
  FOR trigger_record IN 
    SELECT * FROM automated_notification_triggers 
    WHERE event_type = p_event_type 
    AND is_active = true
  LOOP
    BEGIN
      -- Check if notification templates table exists
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notification_templates'
      ) INTO table_exists;
      
      IF NOT table_exists THEN
        error_messages := array_append(error_messages, 'Notification templates table not found');
        CONTINUE;
      END IF;
      
      -- Get template only if notification_template_id is set
      IF trigger_record.notification_template_id IS NOT NULL THEN
        SELECT * INTO template_record
        FROM notification_templates 
        WHERE id = trigger_record.notification_template_id 
        AND is_active = true;
        
        IF NOT FOUND THEN
          error_messages := array_append(error_messages, 'Template not found for trigger: ' || trigger_record.trigger_name);
          CONTINUE;
        END IF;
      ELSE
        -- Skip this trigger if no template is configured
        error_messages := array_append(error_messages, 'No template configured for trigger: ' || trigger_record.trigger_name);
        CONTINUE;
      END IF;
      
      -- Extract customer_id based on entity type
      CASE p_entity_type
        WHEN 'order' THEN
          SELECT user_id INTO customer_id FROM orders WHERE id = p_entity_id;
          -- If user_id is null, try to get it from customer_email
          IF customer_id IS NULL THEN
            SELECT 
              COALESCE(
                (SELECT id FROM auth.users WHERE email = o.customer_email LIMIT 1),
                gen_random_uuid() -- Fallback for guest orders
              ) INTO customer_id
            FROM orders o WHERE o.id = p_entity_id;
          END IF;
        WHEN 'booking' THEN
          -- Get customer from booking - assuming we can link via order
          SELECT COALESCE(o.user_id, gen_random_uuid()) INTO customer_id 
          FROM bookings b 
          LEFT JOIN orders o ON o.id = b.order_id 
          WHERE b.id = p_entity_id;
        WHEN 'application' THEN
          -- For applications, we might notify admins instead
          customer_id := NULL;
        ELSE
          customer_id := NULL;
      END CASE;
      
      -- Only proceed if we have essential data
      IF customer_id IS NOT NULL AND template_record IS NOT NULL THEN
        -- Render template with entity data
        notification_data := jsonb_build_object(
          'entity_type', p_entity_type,
          'entity_id', p_entity_id,
          'entity_data', p_entity_data,
          'template_variables', COALESCE(template_record.variables, '{}'::jsonb)
        );
        
        -- Check if notification_queue table exists before inserting
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'notification_queue'
        ) INTO table_exists;
        
        IF table_exists THEN
          -- Insert into notification queue with safe defaults
          INSERT INTO notification_queue (
            customer_id,
            notification_type,
            delivery_method,
            subject,
            message,
            scheduled_for,
            template_data,
            priority,
            trigger_source
          ) VALUES (
            customer_id,
            p_event_type,
            'in_app', -- Default delivery method
            COALESCE(template_record.subject_template, 'Notification'),
            COALESCE(template_record.body_template, 'You have a new notification'),
            now(),
            notification_data,
            COALESCE(trigger_record.priority, 5),
            'automated_trigger'
          );
          
          -- Update result
          result_data := jsonb_set(
            result_data,
            '{notifications_queued}',
            to_jsonb((result_data->>'notifications_queued')::int + 1)
          );
        ELSE
          error_messages := array_append(error_messages, 'Notification queue table not found');
        END IF;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- Safely handle any errors without breaking the main operation
      error_messages := array_append(error_messages, 'Trigger ' || COALESCE(trigger_record.trigger_name, 'unknown') || ': ' || SQLERRM);
    END;
  END LOOP;
  
  -- Add errors to result but don't fail
  IF array_length(error_messages, 1) > 0 THEN
    result_data := jsonb_set(result_data, '{errors}', to_jsonb(error_messages));
  END IF;
  
  RETURN result_data;
END;
$$;

-- Also make the trigger functions more robust to handle automation failures gracefully
CREATE OR REPLACE FUNCTION notify_order_changes() RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  automation_result JSONB;
BEGIN
  BEGIN
    -- Order status changed
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
      SELECT process_automated_triggers(
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
      ) INTO automation_result;
    END IF;
    
    -- New order created
    IF TG_OP = 'INSERT' THEN
      SELECT process_automated_triggers(
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
      ) INTO automation_result;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't let automation issues prevent order operations
    RAISE WARNING 'Order automation trigger failed: %', SQLERRM;
  END;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;