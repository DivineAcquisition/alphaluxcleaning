import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("Create payment function called with method:", req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const requestBody = await req.json();
    console.log("Request body received:", requestBody);
    
    const { 
      amount, 
      fullAmount,
      paymentType,
      squareFootage, 
      cleaningType, 
      frequency, 
      addOns,
      customerName,
      customerEmail,
      customerPhone,
      scheduledDate,
      scheduledTime,
      nextDayUpcharge
    } = requestBody;

    console.log("Validating required fields...");
    if (!amount || !customerEmail) {
      console.error("Missing required fields:", { amount, customerEmail });
      throw new Error("Missing required fields: amount and customerEmail");
    }

    console.log("Initializing Stripe...");
    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY not found in environment");
      throw new Error("Stripe configuration error");
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    console.log("Checking for existing Stripe customer...");
    // Check if a Stripe customer record exists for this email
    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Found existing customer:", customerId);
    } else {
      console.log("No existing customer found, will create new one");
    }

    console.log("Creating Stripe checkout session...");
    // Create a one-time payment session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: `Bay Area Cleaning Pros - ${cleaningType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Cleaning`,
              description: `${squareFootage} sq ft • ${frequency?.replace(/_/g, ' ')} service${addOns?.length ? ` • Add-ons: ${addOns.join(', ')}` : ''}`
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/`,
      metadata: {
        squareFootage: squareFootage?.toString() || "",
        cleaningType: cleaningType || "",
        frequency: frequency || "",
        addOns: addOns?.join(",") || "",
      }
    });
    
    console.log("Checkout session created:", session.id);

    console.log("Creating order record in database...");
    // Create order record in Supabase
    const orderData = {
      stripe_session_id: session.id,
      amount: Math.round(amount * 100), // Store in cents
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      square_footage: squareFootage,
      cleaning_type: cleaningType,
      frequency: frequency,
      add_ons: addOns,
      service_details: {
        squareFootage,
        cleaningType,
        frequency,
        addOns,
        totalAmount: amount
      },
      status: "pending",
      created_at: new Date().toISOString()
    };

    const { data: orderResult, error: orderError } = await supabaseClient.from("orders").insert(orderData);
    
    if (orderError) {
      console.error("Database insert error:", orderError);
      throw new Error(`Database error: ${orderError.message}`);
    }
    
    console.log("Order created successfully, sending data to GoHighLevel");

    // Send data to GoHighLevel
    try {
      const ghlApiKey = Deno.env.get("GOHIGHLEVEL_API_KEY");
      if (ghlApiKey) {
        const ghlPayload = {
          firstName: customerName?.split(' ')[0] || '',
          lastName: customerName?.split(' ').slice(1).join(' ') || '',
          email: customerEmail,
          phone: customerPhone || '',
          tags: [
            'Bay Area Cleaning Pros',
            cleaningType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            frequency?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          ].filter(Boolean),
          customFields: {
            square_footage: squareFootage?.toString() || '',
            cleaning_type: cleaningType || '',
            frequency: frequency || '',
            add_ons: addOns?.join(', ') || '',
            total_amount: (amount * 100).toString(), // in cents
            payment_type: paymentType || 'full',
            stripe_session_id: session.id,
            service_scheduled: scheduledDate && scheduledTime ? `${scheduledDate} at ${scheduledTime}` : '',
            next_day_booking: nextDayUpcharge > 0 ? 'Yes' : 'No'
          }
        };

        console.log("Sending to GoHighLevel:", JSON.stringify(ghlPayload, null, 2));

        const ghlResponse = await fetch('https://rest.gohighlevel.com/v1/contacts/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ghlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ghlPayload)
        });

        if (ghlResponse.ok) {
          console.log("Successfully sent data to GoHighLevel");
        } else {
          const errorText = await ghlResponse.text();
          console.error("GoHighLevel API error:", ghlResponse.status, errorText);
        }
      }
    } catch (ghlError) {
      console.error("Error sending to GoHighLevel:", ghlError);
      // Don't fail the payment process if GoHighLevel fails
    }

    // Send transaction data to Zapier webhook
    try {
      const transactionData = {
        transaction_id: session.id,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        service_date: scheduledDate,
        service_time: scheduledTime,
        cleaning_type: cleaningType,
        frequency: frequency,
        amount: amount, // Amount in dollars
        currency: 'USD',
        payment_status: 'pending',
        stripe_session_id: session.id,
        add_ons: addOns || [],
        square_footage: squareFootage,
        next_day_booking: nextDayUpcharge > 0,
        payment_type: paymentType
      };

      const zapierResponse = await fetch("https://hooks.zapier.com/hooks/catch/5011258/uusrlmn/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          transaction_type: 'customer_payment',
          ...transactionData,
          source: 'bay_area_cleaning_pros'
        }),
      });

      if (zapierResponse.ok) {
        console.log('Transaction sent to Zapier successfully');
      } else {
        console.log('Warning: Failed to send transaction to Zapier:', zapierResponse.status);
      }
    } catch (zapierError) {
      console.log('Warning: Zapier webhook error:', zapierError);
    }

    console.log("Returning checkout URL");

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});