import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { 
      email, 
      name, 
      phone, 
      address, 
      paymentMethodId, 
      metadata 
    } = await req.json();

    console.log('Creating/retrieving Stripe customer for:', email);

    // Search for existing customer by email
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    let customer: Stripe.Customer;

    if (existingCustomers.data.length > 0) {
      // Customer exists, update it
      customer = existingCustomers.data[0];
      console.log('Found existing customer:', customer.id);
      
      // Update customer with new info
      customer = await stripe.customers.update(customer.id, {
        name,
        phone,
        address: address ? {
          line1: address.line1,
          line2: address.line2 || undefined,
          city: address.city,
          state: address.state,
          postal_code: address.postal_code,
          country: 'US'
        } : undefined,
        metadata: metadata || {}
      });
    } else {
      // Create new customer
      console.log('Creating new customer');
      customer = await stripe.customers.create({
        email,
        name,
        phone,
        address: address ? {
          line1: address.line1,
          line2: address.line2 || undefined,
          city: address.city,
          state: address.state,
          postal_code: address.postal_code,
          country: 'US'
        } : undefined,
        metadata: metadata || {}
      });
    }

    // Attach payment method if provided
    if (paymentMethodId) {
      console.log('Attaching payment method:', paymentMethodId);
      
      // Attach the payment method to the customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id,
      });

      // Set as default payment method
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Update customer record in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseServiceKey) {
      await fetch(`${supabaseUrl}/rest/v1/customers?email=eq.${email}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          stripe_customer_id: customer.id,
          metadata: metadata || {}
        })
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        stripeCustomerId: customer.id,
        customerId: email // Will be replaced with actual DB customer ID
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error creating Stripe customer:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});