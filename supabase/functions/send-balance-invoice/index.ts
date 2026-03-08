import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, data?: any) => {
  console.log(`[send-balance-invoice] ${step}`, data ? JSON.stringify(data, null, 2) : '');
};

serve(async (req) => {
  logStep("Request received", { method: req.method });
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId, daysUntilDue = 7 } = await req.json();

    if (!bookingId) {
      throw new Error("Missing required field: bookingId");
    }

    logStep("Processing invoice for booking", { bookingId, daysUntilDue });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY_ALPHALUX");
    if (!stripeKey) {
      throw new Error("Missing STRIPE_SECRET_KEY_ALPHALUX");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Fetch booking with customer data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, customers(*)')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error(`Booking not found: ${bookingError?.message || 'Unknown error'}`);
    }

    logStep("Booking fetched", { 
      bookingId: booking.id, 
      balanceDue: booking.balance_due,
      customerId: booking.customer_id 
    });

    // Skip if no balance due
    if (!booking.balance_due || booking.balance_due <= 0) {
      logStep("No balance due, skipping invoice", { balanceDue: booking.balance_due });
      return new Response(JSON.stringify({ 
        success: true, 
        skipped: true,
        message: "No balance due" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if invoice already exists
    if (booking.stripe_balance_invoice_id) {
      logStep("Invoice already exists", { invoiceId: booking.stripe_balance_invoice_id });
      return new Response(JSON.stringify({ 
        success: true, 
        skipped: true,
        message: "Invoice already created",
        invoiceId: booking.stripe_balance_invoice_id
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customer = booking.customers;
    if (!customer) {
      throw new Error("Customer data not found for booking");
    }

    // Get or create Stripe customer
    let stripeCustomerId = customer.stripe_customer_id;

    if (!stripeCustomerId) {
      logStep("Creating new Stripe customer", { email: customer.email });
      
      const stripeCustomer = await stripe.customers.create({
        email: customer.email,
        name: customer.name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
        phone: customer.phone,
        metadata: {
          customer_id: customer.id,
        }
      });

      stripeCustomerId = stripeCustomer.id;

      // Update customer record with Stripe ID
      await supabase
        .from('customers')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', customer.id);

      logStep("Stripe customer created", { stripeCustomerId });
    }

    // Create invoice item for the remaining balance
    const balanceAmountCents = Math.round(booking.balance_due * 100);
    const serviceDescription = `Remaining balance for ${booking.service_type || 'cleaning'} service - Booking #${booking.id.substring(0, 8)}`;
    
    logStep("Creating invoice item", { 
      amount: balanceAmountCents, 
      description: serviceDescription 
    });

    const invoiceItem = await stripe.invoiceItems.create({
      customer: stripeCustomerId,
      amount: balanceAmountCents,
      currency: 'usd',
      description: serviceDescription,
      metadata: {
        booking_id: bookingId,
        customer_id: customer.id,
        invoice_type: 'balance_due',
      }
    });

    logStep("Invoice item created", { invoiceItemId: invoiceItem.id });

    // Create the invoice
    const invoice = await stripe.invoices.create({
      customer: stripeCustomerId,
      collection_method: 'send_invoice',
      days_until_due: daysUntilDue,
      auto_advance: true,
      metadata: {
        booking_id: bookingId,
        customer_id: customer.id,
        invoice_type: 'balance_due',
      },
      description: `Balance due for your cleaning service on ${booking.service_date || 'scheduled date'}`,
    });

    logStep("Invoice created", { invoiceId: invoice.id });

    // Finalize the invoice
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
    logStep("Invoice finalized", { invoiceId: finalizedInvoice.id });

    // Send the invoice
    const sentInvoice = await stripe.invoices.sendInvoice(invoice.id);
    logStep("Invoice sent", { 
      invoiceId: sentInvoice.id, 
      hostedUrl: sentInvoice.hosted_invoice_url 
    });

    // Update booking with invoice ID AND hosted URL
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        stripe_balance_invoice_id: sentInvoice.id,
        balance_invoice_url: sentInvoice.hosted_invoice_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) {
      logStep("Warning: Failed to update booking with invoice ID", { error: updateError.message });
    }

    logStep("Balance invoice sent successfully", {
      bookingId,
      invoiceId: sentInvoice.id,
      hostedUrl: sentInvoice.hosted_invoice_url,
      amount: booking.balance_due,
      customerEmail: customer.email,
    });

    // Trigger webhook so Zapier/GHL gets the invoice URL (fixes race condition)
    try {
      await supabase.functions.invoke('enhanced-booking-webhook-v2', {
        body: {
          booking_id: bookingId,
          action: 'payment_invoice_created',
          trigger_event: 'balance_invoice_sent',
        }
      });
      logStep("Webhook triggered for invoice creation");
    } catch (webhookError) {
      logStep("Warning: Failed to trigger webhook after invoice", { error: webhookError });
    }

    return new Response(JSON.stringify({ 
      success: true,
      invoiceId: sentInvoice.id,
      hostedInvoiceUrl: sentInvoice.hosted_invoice_url,
      amount: booking.balance_due,
      customerEmail: customer.email,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
