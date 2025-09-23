-- 1) Create email_templates table (optional: manage in DB)
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,                     -- e.g., 'booking_confirmed'
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2) Update email_jobs table structure
ALTER TABLE public.email_jobs 
  DROP COLUMN IF EXISTS template CASCADE,
  ADD COLUMN IF NOT EXISTS to_name TEXT,
  ADD COLUMN IF NOT EXISTS template_name TEXT NOT NULL DEFAULT 'booking_confirmed',
  DROP COLUMN IF EXISTS payload_json CASCADE,
  ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS provider_message_id TEXT,
  DROP COLUMN IF EXISTS message_id CASCADE;

-- Update existing template column to template_name if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'email_jobs' AND column_name = 'template') THEN
    UPDATE public.email_jobs SET template_name = template WHERE template_name IS NULL;
  END IF;
END $$;

-- 3) Update email_events table structure  
ALTER TABLE public.email_events 
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'resend',
  ADD COLUMN IF NOT EXISTS event TEXT,
  ADD COLUMN IF NOT EXISTS recipient TEXT,
  ADD COLUMN IF NOT EXISTS message_id TEXT,
  ADD COLUMN IF NOT EXISTS meta JSONB,
  DROP COLUMN IF EXISTS metadata_json CASCADE;

-- Update existing columns
UPDATE public.email_events 
SET provider = 'resend', 
    recipient = to_email,
    event = 'sent'
WHERE provider IS NULL;

-- 4) Create email_suppressions table
CREATE TABLE IF NOT EXISTS public.email_suppressions (
  email TEXT PRIMARY KEY,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS email_admin_read ON public.email_templates;
DROP POLICY IF EXISTS email_admin_write ON public.email_templates;
DROP POLICY IF EXISTS email_suppressions_rw ON public.email_suppressions;

-- RLS Policies (without IF NOT EXISTS)
CREATE POLICY email_admin_read ON public.email_templates
  FOR SELECT USING (auth.role() = 'service_role' OR EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY email_admin_write ON public.email_templates
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY email_suppressions_rw ON public.email_suppressions
  FOR ALL USING (auth.role() = 'service_role');

-- Insert initial email templates
INSERT INTO public.email_templates (name, subject, html) VALUES
('booking_confirmed',
 'Confirmed: {{service_type}} on {{service_date}} ({{time_window}})',
 '<div style="font-family:sans-serif;max-width:640px;margin:auto">
   <h2 style="color:#1A1A1A">Thanks, {{first_name}} — your booking is confirmed.</h2>
   <p><b>Service:</b> {{service_type}} ({{frequency}})</p>
   <p><b>Date:</b> {{service_date}} &nbsp; <b>Window:</b> {{time_window}}</p>
   <p><b>Total:</b> ${{price_final}}</p>
   <p><a href="{{manage_link}}" style="background:#ECC98B;padding:12px 16px;border-radius:10px;color:#1A1A1A;text-decoration:none">Manage Booking</a></p>
   <hr/>
   <small>AlphaLuxClean • Support: {{support_phone}}</small>
  </div>'),
('abandoned_checkout',
 'Finish booking — your time window is still available',
 '<div style="font-family:sans-serif;max-width:640px;margin:auto">
   <h2>Still there, {{first_name}}?</h2>
   <p>Pick up where you left off — your details are saved.</p>
   <p><a href="{{resume_link}}" style="background:#ECC98B;padding:12px 16px;border-radius:10px;color:#1A1A1A;text-decoration:none">Resume Booking</a></p>
  </div>'),
('admin_otp',
 'Admin Portal Access Code: {{code}}',
 '<div style="font-family:sans-serif;max-width:640px;margin:auto">
   <h2 style="color:#1A1A1A">Admin Access Code</h2>
   <p>Hello {{adminEmail}},</p>
   <p>Your one-time access code is:</p>
   <div style="background:#f5f5f5;padding:20px;border-radius:8px;text-align:center;margin:20px 0">
     <h1 style="margin:0;font-size:32px;letter-spacing:4px;color:#1A1A1A">{{code}}</h1>
   </div>
   <p>This code expires in 10 minutes.</p>
   <p><strong>Security Notice:</strong> If you did not request this code, please ignore this email.</p>
   <hr/>
   <small>AlphaLuxClean Admin Portal</small>
  </div>')
ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  html = EXCLUDED.html,
  updated_at = now();