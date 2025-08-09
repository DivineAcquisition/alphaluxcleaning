-- Create invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending',
  invoice_data JSONB,
  pdf_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create refunds table
CREATE TABLE public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  stripe_refund_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT,
  processed_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payment_failures table
CREATE TABLE public.payment_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_intent_id TEXT,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add subscribers table if not exists (for subscription management)
CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  subscription_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for invoices
CREATE POLICY "Users can view their own invoices" 
ON public.invoices FOR SELECT 
USING (customer_email = auth.email());

CREATE POLICY "Admins can manage all invoices" 
ON public.invoices FOR ALL 
USING (true);

-- Create RLS policies for refunds
CREATE POLICY "Admins can manage refunds" 
ON public.refunds FOR ALL 
USING (true);

-- Create RLS policies for payment_failures
CREATE POLICY "Admins can view payment failures" 
ON public.payment_failures FOR SELECT 
USING (true);

CREATE POLICY "System can insert payment failures" 
ON public.payment_failures FOR INSERT 
WITH CHECK (true);

-- Create RLS policies for subscribers
CREATE POLICY "Users can view their own subscription" 
ON public.subscribers FOR SELECT 
USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "System can manage subscriptions" 
ON public.subscribers FOR ALL 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_invoices_customer_email ON public.invoices(customer_email);
CREATE INDEX idx_invoices_order_id ON public.invoices(order_id);
CREATE INDEX idx_refunds_order_id ON public.refunds(order_id);
CREATE INDEX idx_payment_failures_order_id ON public.payment_failures(order_id);
CREATE INDEX idx_subscribers_email ON public.subscribers(email);
CREATE INDEX idx_subscribers_stripe_customer_id ON public.subscribers(stripe_customer_id);