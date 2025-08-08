import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-RECURRING-BILLING] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Recurring billing process started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get orders that need recurring billing
    const { data: recurringOrders, error } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('is_recurring', true)
      .eq('service_status', 'active')
      .lte('next_service_date', new Date().toISOString());

    if (error) {
      throw new Error(`Failed to fetch recurring orders: ${error.message}`);
    }

    logStep("Found recurring orders", { count: recurringOrders?.length || 0 });

    const results = [];

    for (const order of recurringOrders || []) {
      try {
        logStep("Processing recurring order", { orderId: order.id, customerEmail: order.customer_email });

        // Get customer's Stripe ID
        const customers = await stripe.customers.list({ 
          email: order.customer_email, 
          limit: 1 
        });

        if (customers.data.length === 0) {
          logStep("No Stripe customer found", { email: order.customer_email });
          continue;
        }

        const customer = customers.data[0];
        
        // Get customer's default payment method
        const paymentMethods = await stripe.paymentMethods.list({
          customer: customer.id,
          type: 'card',
        });

        if (paymentMethods.data.length === 0) {
          logStep("No payment method found", { customerId: customer.id });
          // Mark order for payment method update
          await supabaseClient
            .from('orders')
            .update({ 
              service_status: 'payment_method_required',
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id);
          continue;
        }

        const paymentMethod = paymentMethods.data[0];

        // Create payment intent for recurring charge
        const paymentIntent = await stripe.paymentIntents.create({
          amount: order.amount,
          currency: order.currency || 'usd',
          customer: customer.id,
          payment_method: paymentMethod.id,
          confirm: true,
          return_url: `${req.headers.get("origin") || "http://localhost:3000"}/payment-confirmation`,
          metadata: {
            recurring_order_id: order.id,
            service_type: 'recurring_billing'
          }
        });

        if (paymentIntent.status === 'succeeded') {
          logStep("Recurring payment succeeded", { 
            orderId: order.id, 
            paymentIntentId: paymentIntent.id 
          });

          // Calculate next service date
          const nextDate = calculateNextServiceDate(order.next_service_date, order.recurring_frequency);

          // Update order for next billing cycle
          await supabaseClient
            .from('orders')
            .update({
              next_service_date: nextDate,
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id);

          // Create new order record for this billing cycle
          const { data: newOrder, error: insertError } = await supabaseClient
            .from('orders')
            .insert({
              user_id: order.user_id,
              customer_email: order.customer_email,
              customer_name: order.customer_name,
              amount: order.amount,
              currency: order.currency,
              cleaning_type: order.cleaning_type,
              status: 'paid',
              is_recurring: false, // This is the actual service order
              stripe_payment_intent_id: paymentIntent.id,
              scheduled_date: order.next_service_date,
              service_details: order.service_details,
              created_at: new Date().toISOString()
            })
            .select()
            .single();

          if (!insertError && newOrder) {
            // Generate invoice for this billing cycle
            await supabaseClient.functions.invoke('generate-invoice', {
              body: { order_id: newOrder.id }
            });

            // Send payment confirmation email
            await supabaseClient.functions.invoke('send-payment-confirmation', {
              body: {
                customer_email: order.customer_email,
                customer_name: order.customer_name,
                amount: order.amount,
                service_date: order.next_service_date,
                order_id: newOrder.id
              }
            });
          }

          results.push({
            order_id: order.id,
            status: 'success',
            payment_intent_id: paymentIntent.id,
            next_service_date: nextDate
          });

        } else {
          logStep("Recurring payment failed", { 
            orderId: order.id, 
            paymentIntentId: paymentIntent.id,
            status: paymentIntent.status 
          });

          // Handle failed payment
          await handleRecurringPaymentFailure(order, paymentIntent, supabaseClient);

          results.push({
            order_id: order.id,
            status: 'failed',
            payment_intent_id: paymentIntent.id,
            error: paymentIntent.last_payment_error?.message || 'Payment failed'
          });
        }

      } catch (orderError) {
        logStep("Error processing recurring order", { 
          orderId: order.id, 
          error: orderError.message 
        });

        results.push({
          order_id: order.id,
          status: 'error',
          error: orderError.message
        });
      }
    }

    logStep("Recurring billing process completed", { 
      totalProcessed: results.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length
    });

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in process-recurring-billing", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function calculateNextServiceDate(currentDate: string, frequency: string): string {
  const date = new Date(currentDate);
  
  switch (frequency) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'bi_weekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    default:
      date.setMonth(date.getMonth() + 1); // Default to monthly
  }
  
  return date.toISOString();
}

async function handleRecurringPaymentFailure(order: any, paymentIntent: any, supabaseClient: any) {
  // Log the failure
  await supabaseClient
    .from('payment_failures')
    .insert({
      order_id: order.id,
      payment_intent_id: paymentIntent.id,
      failure_reason: paymentIntent.last_payment_error?.message || 'Unknown error',
      retry_count: 1,
      created_at: new Date().toISOString()
    });

  // Pause the service after 3 failed attempts
  const { data: failures } = await supabaseClient
    .from('payment_failures')
    .select('*')
    .eq('order_id', order.id)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

  if (failures && failures.length >= 3) {
    await supabaseClient
      .from('orders')
      .update({
        service_status: 'suspended',
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id);

    // Send suspension notice
    await supabaseClient.functions.invoke('send-service-suspension-notice', {
      body: {
        customer_email: order.customer_email,
        customer_name: order.customer_name,
        order_id: order.id
      }
    });
  } else {
    // Send payment failure notice
    await supabaseClient.functions.invoke('send-payment-failure-notice', {
      body: {
        customer_email: order.customer_email,
        customer_name: order.customer_name,
        order_id: order.id,
        retry_count: failures?.length || 1
      }
    });
  }
}