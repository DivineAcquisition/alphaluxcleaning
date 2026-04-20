import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ENHANCED-PAYMENT-PROCESSOR] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = (Deno.env.get("STRIPE_SECRET_KEY") || Deno.env.get("STRIPE_SECRET_KEY_ALPHALUX"));
    if (!stripeKey) throw new Error("Stripe secret key is not configured (set STRIPE_SECRET_KEY in Supabase secrets)");

    // Use service role key for secure database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { 
      action, 
      subcontractorId, 
      jobId, 
      amount, 
      paymentType = 'job_completion',
      metadata = {}
    } = await req.json();

    if (!action) throw new Error("Action is required");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    switch (action) {
      case 'process_job_payment':
        return await processJobPayment(supabaseClient, stripe, { 
          subcontractorId, 
          jobId, 
          amount, 
          metadata 
        });
        
      case 'process_tier_bonus':
        return await processTierBonus(supabaseClient, stripe, { 
          subcontractorId, 
          amount, 
          metadata 
        });
        
      case 'process_bulk_payments':
        return await processBulkPayments(supabaseClient, stripe, metadata);
        
      case 'calculate_payment_split':
        return await calculatePaymentSplit(supabaseClient, { 
          subcontractorId, 
          amount 
        });
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in enhanced-payment-processor", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function processJobPayment(supabaseClient: any, stripe: any, params: any) {
  const { subcontractorId, jobId, amount, metadata } = params;
  
  logStep("Processing job payment", { subcontractorId, jobId, amount });

  // Get subcontractor details
  const { data: subcontractor, error: subError } = await supabaseClient
    .from('subcontractors')
    .select('*')
    .eq('id', subcontractorId)
    .single();

  if (subError) {
    throw new Error(`Failed to fetch subcontractor: ${subError.message}`);
  }

  // Calculate payment split based on tier
  const splitResult = await calculatePaymentSplit(supabaseClient, { 
    subcontractorId, 
    amount 
  });

  // Record payment in database
  const { data: payment, error: paymentError } = await supabaseClient
    .from('subcontractor_payments')
    .insert({
      subcontractor_id: subcontractorId,
      job_id: jobId,
      total_amount: amount,
      subcontractor_amount: splitResult.subcontractorAmount,
      company_amount: splitResult.companyAmount,
      split_percentage: splitResult.splitPercentage,
      tier_level: subcontractor.tier_level,
      monthly_fee: subcontractor.monthly_fee,
      hourly_rate: subcontractor.hourly_rate,
      payment_status: 'pending',
      payment_metadata: metadata
    })
    .select()
    .single();

  if (paymentError) {
    throw new Error(`Failed to record payment: ${paymentError.message}`);
  }

  // Process Stripe payment if customer has payment method
  let stripePaymentResult = null;
  if (subcontractor.stripe_customer_id) {
    try {
      stripePaymentResult = await processStripePayment(stripe, {
        customerId: subcontractor.stripe_customer_id,
        amount: splitResult.subcontractorAmount,
        description: `Job completion payment - Job #${jobId}`,
        metadata: {
          subcontractor_id: subcontractorId,
          job_id: jobId,
          payment_id: payment.id
        }
      });

      // Update payment status
      await supabaseClient
        .from('subcontractor_payments')
        .update({
          payment_status: stripePaymentResult.status,
          stripe_payment_intent_id: stripePaymentResult.paymentIntentId,
          paid_at: stripePaymentResult.status === 'succeeded' ? new Date().toISOString() : null
        })
        .eq('id', payment.id);

    } catch (stripeError) {
      logStep("Stripe payment failed", { error: stripeError.message });
      await supabaseClient
        .from('subcontractor_payments')
        .update({ payment_status: 'failed' })
        .eq('id', payment.id);
    }
  }

  return new Response(JSON.stringify({
    success: true,
    payment,
    splitResult,
    stripePaymentResult
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function processTierBonus(supabaseClient: any, stripe: any, params: any) {
  const { subcontractorId, amount, metadata } = params;
  
  logStep("Processing tier bonus", { subcontractorId, amount });

  // Get subcontractor details
  const { data: subcontractor, error: subError } = await supabaseClient
    .from('subcontractors')
    .select('*')
    .eq('id', subcontractorId)
    .single();

  if (subError) {
    throw new Error(`Failed to fetch subcontractor: ${subError.message}`);
  }

  // Record bonus payment
  const { data: payment, error: paymentError } = await supabaseClient
    .from('subcontractor_payments')
    .insert({
      subcontractor_id: subcontractorId,
      total_amount: amount,
      subcontractor_amount: amount,
      company_amount: 0,
      split_percentage: 100,
      tier_level: subcontractor.tier_level,
      payment_status: 'pending',
      payment_type: 'tier_bonus',
      payment_metadata: metadata
    })
    .select()
    .single();

  if (paymentError) {
    throw new Error(`Failed to record bonus payment: ${paymentError.message}`);
  }

  return new Response(JSON.stringify({
    success: true,
    payment
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function processBulkPayments(supabaseClient: any, stripe: any, metadata: any) {
  const { paymentIds } = metadata;
  
  logStep("Processing bulk payments", { count: paymentIds?.length });

  if (!paymentIds || !Array.isArray(paymentIds)) {
    throw new Error("paymentIds array is required for bulk processing");
  }

  const results = [];
  
  for (const paymentId of paymentIds) {
    try {
      // Get payment details
      const { data: payment, error: paymentError } = await supabaseClient
        .from('subcontractor_payments')
        .select('*, subcontractor:subcontractors(*)')
        .eq('id', paymentId)
        .single();

      if (paymentError) {
        results.push({ paymentId, success: false, error: paymentError.message });
        continue;
      }

      // Process individual payment
      if (payment.subcontractor.stripe_customer_id) {
        const stripeResult = await processStripePayment(stripe, {
          customerId: payment.subcontractor.stripe_customer_id,
          amount: payment.subcontractor_amount,
          description: `Bulk payment processing - Payment #${paymentId}`,
          metadata: {
            payment_id: paymentId,
            subcontractor_id: payment.subcontractor_id
          }
        });

        // Update payment status
        await supabaseClient
          .from('subcontractor_payments')
          .update({
            payment_status: stripeResult.status,
            stripe_payment_intent_id: stripeResult.paymentIntentId,
            paid_at: stripeResult.status === 'succeeded' ? new Date().toISOString() : null
          })
          .eq('id', paymentId);

        results.push({ 
          paymentId, 
          success: true, 
          status: stripeResult.status 
        });
      } else {
        results.push({ 
          paymentId, 
          success: false, 
          error: "No Stripe customer ID" 
        });
      }
    } catch (error) {
      results.push({ 
        paymentId, 
        success: false, 
        error: error.message 
      });
    }
  }

  return new Response(JSON.stringify({
    success: true,
    processed: results.length,
    results
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function calculatePaymentSplit(supabaseClient: any, params: any) {
  const { subcontractorId, amount } = params;
  
  // Get subcontractor's current split tier
  const { data: subcontractor, error } = await supabaseClient
    .from('subcontractors')
    .select('split_tier, tier_level')
    .eq('id', subcontractorId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch subcontractor: ${error.message}`);
  }

  // Define split percentages based on tier
  const splitPercentages = {
    '50_50': 50,
    '35_65': 65,
    '25_75': 75,
    '20_80': 80
  };

  // Get tier-based split percentage (higher tiers get better splits)
  let splitPercentage = splitPercentages[subcontractor.split_tier] || 50;
  
  // Tier-based bonus adjustments
  if (subcontractor.tier_level >= 3) {
    splitPercentage = Math.min(splitPercentage + 5, 85); // Elite tier bonus
  } else if (subcontractor.tier_level >= 2) {
    splitPercentage = Math.min(splitPercentage + 2, 82); // Professional tier bonus
  }

  const subcontractorAmount = Math.round(amount * (splitPercentage / 100));
  const companyAmount = amount - subcontractorAmount;

  return new Response(JSON.stringify({
    success: true,
    splitPercentage,
    subcontractorAmount,
    companyAmount,
    totalAmount: amount
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function processStripePayment(stripe: any, params: any) {
  const { customerId, amount, description, metadata } = params;
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    customer: customerId,
    description,
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  // Confirm payment intent
  const confirmedPayment = await stripe.paymentIntents.confirm(paymentIntent.id);

  return {
    paymentIntentId: confirmedPayment.id,
    status: confirmedPayment.status,
    amount: confirmedPayment.amount / 100
  };
}