import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  getAllConfiguredAccounts,
  resolveAccountBySlug,
  type StripeAccountCredentials,
} from "../_shared/stripe-accounts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    // Every account this router knows about — each brings its own
    // secret key + webhook signing secret. We try verifying the
    // incoming signature against each account's signing secret until
    // one succeeds, so a single Supabase endpoint can receive webhooks
    // from both the NY and CA/TX Stripe accounts.
    const accounts = getAllConfiguredAccounts();
    if (accounts.length === 0) {
      throw new Error(
        "No Stripe account is configured. Set STRIPE_SECRET_KEY_NY (and STRIPE_SECRET_KEY_CATX if serving CA/TX).",
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get the raw body and signature
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    let event: any;
    let matchedAccount: StripeAccountCredentials | null = null;

    if (signature) {
      let verificationErrors: string[] = [];
      for (const candidate of accounts) {
        if (!candidate.webhookSecret) continue;
        try {
          const candidateStripe = new Stripe(candidate.secretKey, {
            apiVersion: "2023-10-16",
          });
          event = await candidateStripe.webhooks.constructEventAsync(
            body,
            signature,
            candidate.webhookSecret,
          );
          matchedAccount = candidate;
          logStep("Webhook signature verified", {
            slug: candidate.slug,
            account: candidate.displayName,
          });
          break;
        } catch (err: any) {
          verificationErrors.push(`${candidate.slug}: ${err?.message || err}`);
        }
      }

      if (!event || !matchedAccount) {
        logStep("Webhook signature verification failed for all accounts", {
          errors: verificationErrors,
        });
        return new Response(
          `Webhook Error: signature did not validate against any configured account (${verificationErrors.join("; ")})`,
          { status: 400 },
        );
      }
    } else {
      // No signature header — development / replay scenario only.
      // Never accepted in production; the Stripe dashboard always
      // sends a signature.
      logStep("Warning: No stripe-signature header, parsing without verification");
      event = JSON.parse(body);
      matchedAccount = accounts[0];
    }

    // Re-resolve the account by slug in case the event payload pins
    // the booking to a specific account and that differs from the
    // one whose signing secret matched (shouldn't happen in practice,
    // but worth being correct).
    const slugFromMetadata =
      event?.data?.object?.metadata?.stripe_account_slug ||
      null;
    const accountForHandling =
      resolveAccountBySlug(slugFromMetadata) || matchedAccount;
    const stripe = new Stripe(accountForHandling.secretKey, {
      apiVersion: "2023-10-16",
    });

    logStep("Event received", {
      type: event.type,
      id: event.id,
      account: accountForHandling.displayName,
      slug: accountForHandling.slug,
    });

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object, supabaseClient, stripe);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object, supabaseClient);
        break;
      
      case 'invoice.created':
        await handleInvoiceCreated(event.data.object, supabaseClient);
        break;
      
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object, supabaseClient);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object, supabaseClient);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object, supabaseClient);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object, supabaseClient);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, supabaseClient);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, supabaseClient);
        break;
      
      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handlePaymentSucceeded(paymentIntent: any, supabaseClient: any, stripe: any) {
  logStep("Processing payment success", { paymentIntentId: paymentIntent.id });
  
  const bookingId = paymentIntent.metadata?.booking_id;
  const paymentType = paymentIntent.metadata?.payment_type;
  
  if (!bookingId) {
    // Try finding by payment intent ID in bookings table
    const { data: bookings } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntent.id);
    
    if (!bookings?.length) {
      logStep("No booking found for payment intent", { paymentIntentId: paymentIntent.id });
      return;
    }
    
    const booking = bookings[0];
    await processBookingPayment(booking, paymentIntent, supabaseClient, stripe);
    return;
  }

  // Get booking by ID from metadata
  const { data: booking, error } = await supabaseClient
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (error || !booking) {
    logStep("Booking not found", { bookingId });
    return;
  }

  await processBookingPayment(booking, paymentIntent, supabaseClient, stripe);
}

async function processBookingPayment(booking: any, paymentIntent: any, supabaseClient: any, stripe: any) {
  const paymentType = paymentIntent.metadata?.payment_type || 'deposit';
  const planType = paymentIntent.metadata?.plan_type;
  
  logStep("Processing booking payment", { 
    bookingId: booking.id, 
    paymentType, 
    planType 
  });

  // Update booking status
  await supabaseClient
    .from('bookings')
    .update({
      status: 'confirmed',
      payment_status: paymentType === 'deposit' ? 'deposit_paid' : 'paid',
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', booking.id);

  // For 90-day plan, create the subscription for monthly payments
  if (planType === '90_day_plan' && paymentType === 'deposit') {
    await create90DaySubscription(booking, paymentIntent, supabaseClient, stripe);
  }

  // Send confirmation email (branded AlphaLux template)
  try {
    await supabaseClient.functions.invoke('send-booking-confirmation', {
      body: { bookingId: booking.id }
    });
    logStep("Confirmation email sent", { bookingId: booking.id });
  } catch (emailError) {
    logStep("Failed to send confirmation email", { error: emailError.message });
  }

  // Also dispatch a branded payment receipt via the unified email system.
  // This is idempotent: send-email-system short-circuits on duplicate event_id.
  try {
    const { data: customerRow } = await supabaseClient
      .from('customers')
      .select('email, first_name, last_name, referral_code')
      .eq('id', booking.customer_id)
      .single();

    if (customerRow?.email) {
      const amountCents = paymentIntent.amount_received || paymentIntent.amount || 0;
      const amountDollars = (amountCents / 100).toFixed(2);
      const appUrl = Deno.env.get("APP_URL") || "https://alphaluxcleaning.com";

      await supabaseClient.functions.invoke('send-email-system', {
        body: {
          template: 'payment_succeeded',
          to: customerRow.email,
          category: 'transactional',
          event_id: `payment_succeeded_${paymentIntent.id}`,
          data: {
            first_name: customerRow.first_name || 'there',
            amount: amountDollars,
            service_type: booking.service_type || 'Cleaning Service',
            service_date: booking.service_date
              ? new Date(booking.service_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'To be scheduled',
            receipt_link: `${appUrl}/order-status?booking=${booking.id}`,
            referral_code: customerRow.referral_code || '',
            referral_link: `${appUrl}/referrals`,
            app_url: appUrl,
          },
        },
      });
      logStep("Payment receipt email dispatched", { bookingId: booking.id });
    }
  } catch (receiptError) {
    logStep("Failed to send payment receipt", { error: (receiptError as Error).message });
  }

  // Trigger balance invoice if there's a remaining balance and one hasn't been created yet
  // (Idempotent: confirm-booking-payment may also call this; send-balance-invoice short-circuits
  // if stripe_balance_invoice_id is already set.)
  try {
    const { data: freshBooking } = await supabaseClient
      .from('bookings')
      .select('balance_due, stripe_balance_invoice_id')
      .eq('id', booking.id)
      .single();

    const balanceDue = freshBooking?.balance_due || 0;
    if (balanceDue > 0 && !freshBooking?.stripe_balance_invoice_id) {
      logStep("Triggering balance invoice from webhook", { bookingId: booking.id, balanceDue });
      const invoiceResult = await supabaseClient.functions.invoke('send-balance-invoice', {
        body: { bookingId: booking.id, daysUntilDue: 7 }
      });
      if (invoiceResult.error) {
        logStep("Balance invoice error", { error: invoiceResult.error });
      } else {
        logStep("Balance invoice triggered", { data: invoiceResult.data });
      }
    } else {
      logStep("Skipping balance invoice", { balanceDue, hasInvoice: !!freshBooking?.stripe_balance_invoice_id });
    }
  } catch (invoiceError) {
    logStep("Failed to trigger balance invoice", { error: (invoiceError as Error).message });
  }

  logStep("Booking payment processed", { bookingId: booking.id });
}

async function create90DaySubscription(booking: any, paymentIntent: any, supabaseClient: any, stripe: any) {
  logStep("Creating 90-day subscription", { bookingId: booking.id });

  try {
    const stripeCustomerId = paymentIntent.customer;
    const pricingBreakdown = booking.pricing_breakdown;
    
    if (!stripeCustomerId || !pricingBreakdown?.stripePriceId) {
      logStep("Missing data for subscription creation", { 
        stripeCustomerId, 
        pricingBreakdown 
      });
      return;
    }

    // Get the payment method from the payment intent
    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: 'card',
    });

    if (!paymentMethods.data.length) {
      logStep("No payment method found for customer", { stripeCustomerId });
      return;
    }

    const defaultPaymentMethod = paymentMethods.data[0].id;

    // Set the default payment method on the customer
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: {
        default_payment_method: defaultPaymentMethod,
      },
    });

    // Calculate billing start date (30 days from now)
    const billingStartDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);

    // Create subscription with 30-day delay and 3 billing cycles
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: pricingBreakdown.stripePriceId }],
      billing_cycle_anchor: billingStartDate,
      proration_behavior: 'none',
      cancel_at_period_end: false,
      metadata: {
        booking_id: booking.id,
        plan_type: '90_day_plan',
        payment_number: '1',
        total_payments: '3',
      },
      // Cancel after 3 payments
      cancel_at: billingStartDate + (3 * 30 * 24 * 60 * 60),
    });

    logStep("Subscription created", { 
      subscriptionId: subscription.id,
      billingStart: new Date(billingStartDate * 1000).toISOString()
    });

    // Update booking with subscription ID
    await supabaseClient
      .from('bookings')
      .update({
        stripe_subscription_id: subscription.id,
        is_recurring: true,
        recurring_active: true,
      })
      .eq('id', booking.id);

    // Create recurring_services record
    await supabaseClient
      .from('recurring_services')
      .insert({
        customer_id: booking.customer_id,
        booking_id: booking.id,
        service_type: booking.service_type,
        frequency: 'monthly',
        price_per_service: pricingBreakdown.monthlyAmount,
        status: 'active',
        stripe_subscription_id: subscription.id,
        next_service_date: new Date(billingStartDate * 1000).toISOString(),
        commitment_months: 3,
      });

    logStep("90-day subscription setup complete", { bookingId: booking.id });
  } catch (error) {
    logStep("Failed to create 90-day subscription", { error: error.message });
  }
}

async function handlePaymentFailed(paymentIntent: any, supabaseClient: any) {
  logStep("Processing payment failure", { paymentIntentId: paymentIntent.id });
  
  const bookingId = paymentIntent.metadata?.booking_id;
  
  if (bookingId) {
    await supabaseClient
      .from('bookings')
      .update({
        payment_status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);
  }

  logStep("Payment failure processed", { bookingId });
}

async function handleInvoiceCreated(invoice: any, supabaseClient: any) {
  logStep("Invoice created", { invoiceId: invoice.id, subscription: invoice.subscription });
  
  // For subscription invoices, we might want to notify the customer
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  const { data: bookings } = await supabaseClient
    .from('bookings')
    .select('*, customers(*)')
    .eq('stripe_subscription_id', subscriptionId);

  if (bookings?.length) {
    const booking = bookings[0];
    logStep("Upcoming payment notification", { 
      bookingId: booking.id,
      amount: invoice.amount_due / 100
    });
    
    // Could send upcoming payment notification email here
  }
}

async function handleInvoicePaid(invoice: any, supabaseClient: any) {
  logStep("Invoice paid", { invoiceId: invoice.id, subscription: invoice.subscription });
  
  const subscriptionId = invoice.subscription;
  const invoiceType = invoice.metadata?.invoice_type;
  const bookingIdFromMeta = invoice.metadata?.booking_id;

  // Handle one-time balance invoice (not subscription)
  if (!subscriptionId && invoiceType === 'balance_due' && bookingIdFromMeta) {
    logStep("Processing one-time balance invoice", { bookingId: bookingIdFromMeta, invoiceId: invoice.id });

    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*, customers(*)')
      .eq('id', bookingIdFromMeta)
      .single();

    if (bookingError || !booking) {
      logStep("Booking not found for balance invoice", { bookingId: bookingIdFromMeta });
      return;
    }

    const amountPaid = invoice.amount_paid / 100;

    // Record the payment
    await supabaseClient
      .from('payments')
      .insert({
        booking_id: booking.id,
        amount: amountPaid,
        status: 'succeeded',
        stripe_payment_id: invoice.payment_intent || invoice.id,
        charge_type: 'balance',
        currency: 'usd',
        invoice_id: invoice.id,
      });

    // Update booking - balance is now paid
    await supabaseClient
      .from('bookings')
      .update({
        balance_due: 0,
        payment_status: 'fully_paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id);

    // Send confirmation email
    try {
      await supabaseClient.functions.invoke('send-recurring-payment-confirmation', {
        body: {
          bookingId: booking.id,
          customerId: booking.customer_id,
          customerEmail: booking.customers?.email,
          customerName: booking.customers?.name || `${booking.customers?.first_name || ''} ${booking.customers?.last_name || ''}`.trim(),
          amountPaid,
          paymentNumber: 'Final',
          totalPayments: 'Balance',
          remainingBalance: 0,
        }
      });
      logStep("Balance payment confirmation sent", { bookingId: booking.id });
    } catch (emailError) {
      logStep("Failed to send balance payment confirmation", { error: emailError.message });
    }

    logStep("Balance invoice payment processed", { bookingId: booking.id, amountPaid });
    return;
  }

  // Handle subscription invoice
  if (!subscriptionId) {
    logStep("Invoice has no subscription and is not a balance invoice, skipping", { invoiceId: invoice.id });
    return;
  }

  // Get booking by subscription ID
  const { data: bookings } = await supabaseClient
    .from('bookings')
    .select('*, customers(*)')
    .eq('stripe_subscription_id', subscriptionId);

  if (!bookings?.length) {
    logStep("No booking found for subscription", { subscriptionId });
    return;
  }

  const booking = bookings[0];
  const amountPaid = invoice.amount_paid / 100;

  // Determine payment number from invoice metadata or calculate
  const existingPayments = await supabaseClient
    .from('payments')
    .select('*')
    .eq('booking_id', booking.id)
    .eq('charge_type', 'recurring');

  const paymentNumber = (existingPayments.data?.length || 0) + 1;

  // Record the payment
  await supabaseClient
    .from('payments')
    .insert({
      booking_id: booking.id,
      amount: amountPaid,
      status: 'succeeded',
      stripe_payment_id: invoice.payment_intent,
      charge_type: 'recurring',
      currency: 'usd',
    });

  // Update booking balance
  const currentBalance = booking.balance_due || 0;
  const newBalance = Math.max(0, currentBalance - amountPaid);

  await supabaseClient
    .from('bookings')
    .update({
      balance_due: newBalance,
      payment_status: newBalance === 0 ? 'fully_paid' : 'partial',
      updated_at: new Date().toISOString(),
    })
    .eq('id', booking.id);

  // Send payment confirmation email
  try {
    await supabaseClient.functions.invoke('send-recurring-payment-confirmation', {
      body: {
        bookingId: booking.id,
        customerId: booking.customer_id,
        customerEmail: booking.customers?.email,
        customerName: booking.customers?.name || `${booking.customers?.first_name} ${booking.customers?.last_name}`,
        amountPaid,
        paymentNumber,
        totalPayments: 3,
        remainingBalance: newBalance,
      }
    });
    logStep("Recurring payment confirmation sent", { bookingId: booking.id, paymentNumber });
  } catch (emailError) {
    logStep("Failed to send payment confirmation", { error: emailError.message });
  }

  logStep("Invoice payment processed", { bookingId: booking.id, paymentNumber, amountPaid });
}

async function handleInvoicePaymentSucceeded(invoice: any, supabaseClient: any) {
  logStep("Processing invoice payment success", { invoiceId: invoice.id });
  
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;
  
  if (subscriptionId) {
    await supabaseClient
      .from('subscribers')
      .update({
        subscribed: true,
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_customer_id', customerId);
      
    // Also update recurring_services
    await supabaseClient
      .from('recurring_services')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId);
  }
}

async function handleInvoicePaymentFailed(invoice: any, supabaseClient: any) {
  logStep("Processing invoice payment failure", { invoiceId: invoice.id });
  
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;
  
  // Update subscription status
  await supabaseClient
    .from('subscribers')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customerId);

  // Get booking and send notification
  if (subscriptionId) {
    const { data: bookings } = await supabaseClient
      .from('bookings')
      .select('*, customers(*)')
      .eq('stripe_subscription_id', subscriptionId);

    if (bookings?.length) {
      const booking = bookings[0];
      
      // Update recurring service status
      await supabaseClient
        .from('recurring_services')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscriptionId);

      logStep("Payment failure recorded for booking", { bookingId: booking.id });
      
      // Could send payment failure notification here
    }
  }
}

async function handleSubscriptionCreated(subscription: any, supabaseClient: any) {
  logStep("Subscription created", { subscriptionId: subscription.id });
  
  const bookingId = subscription.metadata?.booking_id;
  if (!bookingId) return;

  await supabaseClient
    .from('bookings')
    .update({
      stripe_subscription_id: subscription.id,
      is_recurring: true,
      recurring_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);
}

async function handleSubscriptionUpdated(subscription: any, supabaseClient: any) {
  logStep("Processing subscription update", { subscriptionId: subscription.id });
  
  const customerId = subscription.customer;
  const bookingId = subscription.metadata?.booking_id;
  
  // Update subscribers table
  await supabaseClient
    .from('subscribers')
    .update({
      subscription_status: subscription.status,
      subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customerId);

  // Update recurring_services
  await supabaseClient
    .from('recurring_services')
    .update({
      status: subscription.status === 'active' ? 'active' : subscription.status,
      next_service_date: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  // Update booking
  if (bookingId) {
    await supabaseClient
      .from('bookings')
      .update({
        recurring_active: subscription.status === 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);
  }
}

async function handleSubscriptionDeleted(subscription: any, supabaseClient: any) {
  logStep("Processing subscription deletion", { subscriptionId: subscription.id });
  
  const customerId = subscription.customer;
  const bookingId = subscription.metadata?.booking_id;
  
  // Update subscribers
  await supabaseClient
    .from('subscribers')
    .update({
      subscribed: false,
      subscription_status: 'canceled',
      subscription_end: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customerId);

  // Update recurring_services
  await supabaseClient
    .from('recurring_services')
    .update({
      status: 'completed',
      cancellation_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  // Update booking - mark as fully paid (3 payments complete)
  if (bookingId) {
    await supabaseClient
      .from('bookings')
      .update({
        recurring_active: false,
        payment_status: 'fully_paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);
    
    logStep("90-day plan completed", { bookingId });
  }
}
