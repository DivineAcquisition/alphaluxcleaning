
-- Update webhook_configurations organization_name default
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_configurations' AND column_name = 'organization_name') THEN
    ALTER TABLE public.webhook_configurations ALTER COLUMN organization_name SET DEFAULT 'AlphaLux Clean';
    UPDATE public.webhook_configurations SET organization_name = 'AlphaLux Clean' WHERE organization_name IN ('Bay Area Cleaning Pros', 'Bay Area Cleaning Professionals');
  END IF;
END $$;

-- Update email_settings from_name default
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_settings' AND column_name = 'from_name') THEN
    ALTER TABLE public.email_settings ALTER COLUMN from_name SET DEFAULT 'AlphaLux Clean';
    UPDATE public.email_settings SET from_name = 'AlphaLux Clean' WHERE from_name IN ('Bay Area Cleaning Pros', 'Bay Area Cleaning Professionals');
  END IF;
END $$;

-- Update notification_templates with old brand references
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_templates') THEN
    UPDATE public.notification_templates 
    SET body = REPLACE(REPLACE(body, 'Bay Area Cleaning Professionals', 'AlphaLux Clean'), 'Bay Area Cleaning Pros', 'AlphaLux Clean')
    WHERE body LIKE '%Bay Area%';
    
    UPDATE public.notification_templates 
    SET title = REPLACE(REPLACE(title, 'Bay Area Cleaning Professionals', 'AlphaLux Clean'), 'Bay Area Cleaning Pros', 'AlphaLux Clean')
    WHERE title LIKE '%Bay Area%';
  END IF;
END $$;
