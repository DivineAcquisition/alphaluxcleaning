import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-90DAY-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const {
      bookingId,
      customerId,
      customerEmail,
      customerName,
      customerPhone,
      depositAmount,
      monthlyAmount,
      totalAmount,
      address,
      metadata = {},
    } = await req.json();

    logStep('Request received', { bookingId, customerEmail, depositAmount, monthlyAmount });

    if (!customerEmail || !bookingId || !depositAmount || !monthlyAmount) {
      throw new Error('Missing required fields: customerEmail, bookingId, depositAmount, monthlyAmount');
    }

    // Step 1: Find or create Stripe customer
    logStep('Finding/creating Stripe customer');
    let stripeCustomer: Stripe.Customer;

    const existingCustomers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      stripeCustomer = existingCustomers.data[0];
      logStep('Found existing Stripe customer', { stripeCustomerId: stripeCustomer.id });
      
      // Update customer details
      stripeCustomer = await stripe.customers.update(stripeCustomer.id, {
        name: customerName,
        phone: customerPhone,
        address: address ? {
          line1: address.line1,
          line2: address.line2 || undefined,
          city: address.city,
          state: address.state,
          postal_code: address.postal_code,
          country: 'US',
        } : undefined,
        metadata: {
          booking_id: bookingId,
          supabase_customer_id: customerId,
          plan_type: '90_day_plan',
          ...metadata,
        },
      });
    } else {
      stripeCustomer = await stripe.customers.create({
        email: customerEmail,
        name: customerName,
        phone: customerPhone,
        address: address ? {
          line1: address.line1,
          line2: address.line2 || undefined,
          city: address.city,
          state: address.state,
          postal_code: address.postal_code,
          country: 'US',
        } : undefined,
        metadata: {
          booking_id: bookingId,
          supabase_customer_id: customerId,
          plan_type: '90_day_plan',
          ...metadata,
        },
      });
      logStep('Created new Stripe customer', { stripeCustomerId: stripeCustomer.id });
    }

    // Step 2: Create a payment intent for the deposit
    logStep('Creating deposit payment intent', { amount: depositAmount });
    
    const depositPaymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(depositAmount * 100), // Convert to cents
      currency: 'usd',
      customer: stripeCustomer.id,
      setup_future_usage: 'off_session', // Save payment method for future charges
      metadata: {
        booking_id: bookingId,
        payment_type: 'deposit',
        plan_type: '90_day_plan',
        total_plan_amount: String(totalAmount),
        monthly_amount: String(monthlyAmount),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    logStep('Deposit payment intent created', { 
      paymentIntentId: depositPaymentIntent.id,
      clientSecret: depositPaymentIntent.client_secret ? 'present' : 'missing'
    });

    // Step 3: Create a product and price for monthly payments (if not exists)
    logStep('Creating/finding monthly payment product');
    
    // Search for existing product
    const products = await stripe.products.list({
      active: true,
      limit: 100,
    });
    
    let monthlyProduct = products.data.find(p => p.metadata?.type === '90_day_monthly_payment');
    
    if (!monthlyProduct) {
      monthlyProduct = await stripe.products.create({
        name: '90-Day Reset & Maintain Plan - Monthly Payment',
        description: 'Monthly payment for the 90-Day Deep Clean Bundle',
        metadata: {
          type: '90_day_monthly_payment',
        },
      });
      logStep('Created new product', { productId: monthlyProduct.id });
    }

    // Create a price for this specific booking amount
    const monthlyPrice = await stripe.prices.create({
      unit_amount: Math.round(monthlyAmount * 100),
      currency: 'usd',
      recurring: {
        interval: 'month',
        interval_count: 1,
      },
      product: monthlyProduct.id,
      metadata: {
        booking_id: bookingId,
      },
    });

    logStep('Created monthly price', { priceId: monthlyPrice.id, amount: monthlyAmount });

    // Step 4: Create subscription (starts 30 days from now, runs for 3 months)
    // We'll create it after the deposit is confirmed via webhook
    // For now, store the subscription config in metadata

    // Update the booking with Stripe info
    const { error: updateError } = await supabaseClient
      .from('bookings')
      .update({
        stripe_payment_intent_id: depositPaymentIntent.id,
        payment_status: 'pending',
        pricing_breakdown: {
          depositAmount,
          monthlyAmount,
          totalAmount,
          monthlyPayments: 3,
          stripePriceId: monthlyPrice.id,
          stripeProductId: monthlyProduct.id,
        },
      })
      .eq('id', bookingId);

    if (updateError) {
      logStep('Warning: Failed to update booking', { error: updateError.message });
    }

    // Update customer record with Stripe customer ID
    if (customerId) {
      await supabaseClient
        .from('customers')
        .update({
          stripe_customer_id: stripeCustomer.id,
        })
        .eq('id', customerId);
    }

    logStep('Successfully prepared 90-day subscription', {
      bookingId,
      stripeCustomerId: stripeCustomer.id,
      depositPaymentIntentId: depositPaymentIntent.id,
      priceId: monthlyPrice.id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        clientSecret: depositPaymentIntent.client_secret,
        paymentIntentId: depositPaymentIntent.id,
        stripeCustomerId: stripeCustomer.id,
        stripePriceId: monthlyPrice.id,
        depositAmount,
        monthlyAmount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    logStep('ERROR', { message: error.message, stack: error.stack });
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
