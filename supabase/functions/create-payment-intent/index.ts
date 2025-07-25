import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    console.log("Starting payment intent creation process...");
    
    const requestBody = await req.json();
    console.log("Request body:", JSON.stringify(requestBody, null, 2));
    
    const { 
      amount, // This is already in cents
      fullAmount,
      paymentType,
      squareFootage, 
      cleaningType, 
      frequency, 
      addOns,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      customerCity,
      customerState,
      customerZipCode,
      scheduledDate,
      scheduledTime,
      nextDayUpcharge
    } = requestBody;

    console.log("Validating required fields...");
    if (!amount || !customerName || !customerEmail) {
      throw new Error("Missing required fields: amount, customerName, customerEmail");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    console.log("Creating Stripe customer...");
    
    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    let customer;
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      console.log("Found existing customer:", customer.id);
    } else {
      // Create new customer
      customer = await stripe.customers.create({
        email: customerEmail,
        name: customerName,
        phone: customerPhone || undefined,
        address: {
          line1: customerAddress,
          city: customerCity,
          state: customerState,
          postal_code: customerZipCode,
          country: 'US',
        },
      });
      console.log("Created new customer:", customer.id);
    }

    console.log("Creating payment intent...");
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Ensure it's an integer
      currency: "usd",
      customer: customer.id,
      metadata: {
        customerName,
        customerEmail,
        customerPhone: customerPhone || '',
        squareFootage: squareFootage?.toString() || '',
        cleaningType: cleaningType || '',
        frequency: frequency || '',
        addOns: addOns?.join(', ') || '',
        fullAmount: fullAmount?.toString() || '',
        paymentType: paymentType || 'full',
        scheduledDate: scheduledDate || '',
        scheduledTime: scheduledTime || '',
        nextDayUpcharge: nextDayUpcharge?.toString() || '0'
      },
    });

    console.log("Payment intent created:", paymentIntent.id);

    // Create order record in database
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: orderData, error: orderError } = await supabaseService
      .from("orders")
      .insert({
        user_id: null, // Guest checkout
        stripe_session_id: paymentIntent.id,
        amount: Math.round(amount / 100), // Convert back to dollars for storage
        currency: "usd",
        status: "pending",
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        cleaning_type: cleaningType,
        frequency: frequency,
        add_ons: addOns,
        square_footage: squareFootage,
        service_details: {
          scheduledDate,
          scheduledTime,
          nextDayUpcharge,
          paymentType,
          fullAmount
        }
      })
      .select()
      .single();

    if (orderError) {
      console.error("Database error:", orderError);
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
            total_amount: Math.round(amount).toString(), // in cents
            payment_type: paymentType || 'full',
            stripe_payment_intent_id: paymentIntent.id,
            service_scheduled: scheduledDate && scheduledTime ? `${scheduledDate} at ${scheduledTime}` : '',
            next_day_booking: nextDayUpcharge > 0 ? 'Yes' : 'No',
            billing_address: `${customerAddress}, ${customerCity}, ${customerState} ${customerZipCode}`
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

    console.log("Returning payment intent client secret");

    return new Response(JSON.stringify({ 
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Payment intent creation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});